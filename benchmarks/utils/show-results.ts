#!/usr/bin/env bun
/**
 * Browser Automation Benchmark - Results Viewer
 *
 * Display and analyze benchmark results.
 *
 * Usage:
 *   bun run benchmarks/utils/show-results.ts [results.json]
 */

import fs from "fs";
import path from "path";
import { aggregateResults, generateResultsTable, compareTools } from "./metrics.js";
import { BenchmarkResult } from "../adapters/types.js";

interface BenchmarkRun {
  timestamp: Date;
  options: unknown;
  results: BenchmarkResult[];
  summary: ReturnType<typeof aggregateResults>;
}

/**
 * Find the most recent results file
 */
function findLatestResults(): string | null {
  const possiblePaths = [
    "./results.json",
    "./results/latest.json",
    "./docs/results.json",
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Look for any JSON file in results directory
  const resultsDir = "./results";
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();

    if (files.length > 0) {
      return path.join(resultsDir, files[0]);
    }
  }

  return null;
}

/**
 * Load results from file
 */
function loadResults(filePath: string): BenchmarkRun {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  // Convert timestamp string to Date
  if (typeof data.timestamp === "string") {
    data.timestamp = new Date(data.timestamp);
  }

  return data;
}

/**
 * Display results in a nice format
 */
function displayResults(run: BenchmarkRun): void {
  console.log("\n" + "=".repeat(60));
  console.log("  Browser Automation Benchmark Results");
  console.log("=".repeat(60));
  console.log(`\n📅 Date: ${run.timestamp.toISOString()}`);

  // Summary
  console.log("\n📊 Summary");
  console.log("-".repeat(40));
  console.log(`Total runs: ${run.summary.totalRuns}`);
  console.log(`Success rate: ${run.summary.successRate.toFixed(1)}%`);
  console.log(`Average duration: ${(run.summary.avgDuration / 1000).toFixed(2)}s`);
  console.log(`Average quality: ${run.summary.avgQuality.toFixed(1)}%`);

  // By Tool
  console.log("\n🛠️  By Tool");
  console.log("-".repeat(40));

  const toolData = Object.entries(run.summary.byTool).map(([tool, stats]) => ({
    tool,
    ...stats,
  }));

  // Sort by success rate, then quality
  toolData.sort((a, b) => {
    if (b.successRate !== a.successRate) {
      return b.successRate - a.successRate;
    }
    return b.avgQuality - a.avgQuality;
  });

  console.log("| Tool | Success | Duration | Quality | Rank |");
  console.log("|------|---------|----------|---------|------|");

  toolData.forEach((t, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
    console.log(
      `| ${t.tool} | ${t.successRate.toFixed(0)}% | ${(t.avgDuration / 1000).toFixed(2)}s | ${t.avgQuality.toFixed(0)}% | ${medal} |`
    );
  });

  // Detailed Results
  console.log("\n📋 Detailed Results");
  console.log("-".repeat(40));
  console.log(generateResultsTable(run.results));

  // Per-Scenario Comparison
  const scenarios = [...new Set(run.results.map((r) => r.scenario))];

  console.log("\n🔬 Scenario Comparisons");
  console.log("-".repeat(40));

  for (const scenario of scenarios) {
    const comparison = compareTools(run.results, scenario);
    console.log(`\n### ${scenario}`);
    console.log("| Rank | Tool | Success | Duration | Quality |");
    console.log("|------|------|---------|----------|---------|");

    for (const entry of comparison.comparison) {
      const success = entry.success ? "✅" : "❌";
      const duration = (entry.duration / 1000).toFixed(2) + "s";
      const quality = entry.quality !== null ? `${entry.quality.toFixed(0)}%` : "N/A";
      const rank = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
      console.log(`| ${rank} | ${entry.tool} | ${success} | ${duration} | ${quality} |`);
    }
  }

  // Winner Summary
  console.log("\n🏆 Overall Rankings");
  console.log("-".repeat(40));

  if (toolData.length > 0) {
    console.log(`\n1st Place: ${toolData[0].tool} 🥇`);
    console.log(`   Success: ${toolData[0].successRate.toFixed(0)}% | Quality: ${toolData[0].avgQuality.toFixed(0)}%`);

    if (toolData.length > 1) {
      console.log(`\n2nd Place: ${toolData[1].tool} 🥈`);
      console.log(`   Success: ${toolData[1].successRate.toFixed(0)}% | Quality: ${toolData[1].avgQuality.toFixed(0)}%`);
    }

    if (toolData.length > 2) {
      console.log(`\n3rd Place: ${toolData[2].tool} 🥉`);
      console.log(`   Success: ${toolData[2].successRate.toFixed(0)}% | Quality: ${toolData[2].avgQuality.toFixed(0)}%`);
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Main
 */
function main(): void {
  const args = process.argv.slice(2);
  let filePath: string | null = args[0] || null;

  if (!filePath) {
    filePath = findLatestResults();
  }

  if (!filePath || !fs.existsSync(filePath)) {
    console.error("No results file found. Run benchmarks first:");
    console.error("  bun run benchmark --output=results.json");
    process.exit(1);
  }

  console.log(`Loading results from: ${filePath}`);

  try {
    const run = loadResults(filePath);
    displayResults(run);
  } catch (error) {
    console.error("Failed to load results:", error);
    process.exit(1);
  }
}

main();
