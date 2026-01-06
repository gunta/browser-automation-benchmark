#!/usr/bin/env bun
/**
 * Browser Automation Benchmark - Main Runner
 *
 * Orchestrates benchmark execution across all tools and scenarios.
 *
 * LLM Model: Claude Opus 4.5 (claude-opus-4-5) via Claude Code
 * @see https://platform.claude.com/docs/en/about-claude/models/overview
 *
 * Usage:
 *   bun run benchmarks/runner.ts [options]
 *
 * Options:
 *   --scenario=<id>     Run specific scenario only
 *   --adapter=<name>    Run specific adapter only
 *   --runs=<n>          Number of runs per scenario (default: 1)
 *   --output=<path>     Output results to file
 *   --json              Output as JSON
 *   --verbose           Verbose output
 *   --model=<id>        LLM model to use (default: claude-opus-4-5)
 */

/**
 * Recommended model for benchmarks
 * Claude Opus 4.5 offers premium intelligence with practical performance
 */
export const DEFAULT_MODEL = "claude-opus-4-5";

import fs from "fs";
import path from "path";
import {
  createAdapter,
  getAdapterNames,
  AdapterName,
  BrowserAutomationAdapter,
  BenchmarkResult,
  adapterMetadata,
} from "./adapters/index.js";
import {
  primaryScenarios,
  extendedScenarios,
  allScenarios,
  getScenarioById,
  BenchmarkScenario,
} from "./scenarios/index.js";
import {
  aggregateResults,
  generateResultsTable,
  formatBenchmarkResult,
  compareTools,
} from "./utils/metrics.js";
import { isCcusageAvailable, getDailyUsage, formatUsage } from "./utils/ccusage.js";

/**
 * CLI options
 */
interface RunnerOptions {
  scenario?: string;
  adapter?: AdapterName;
  runs: number;
  output?: string;
  json: boolean;
  verbose: boolean;
  extended: boolean;
  headless: boolean;
  timeout: number;
  model: string;
}

/**
 * Benchmark run result
 */
interface BenchmarkRun {
  timestamp: Date;
  options: RunnerOptions;
  results: BenchmarkResult[];
  summary: ReturnType<typeof aggregateResults>;
}

/**
 * Parse command line arguments
 */
function parseArgs(): RunnerOptions {
  const args = process.argv.slice(2);
  const options: RunnerOptions = {
    runs: 1,
    json: false,
    verbose: false,
    extended: false,
    headless: false,
    timeout: 60000,
    model: DEFAULT_MODEL,
  };

  for (const arg of args) {
    if (arg.startsWith("--scenario=")) {
      options.scenario = arg.split("=")[1];
    } else if (arg.startsWith("--adapter=")) {
      options.adapter = arg.split("=")[1] as AdapterName;
    } else if (arg.startsWith("--runs=")) {
      options.runs = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--output=")) {
      options.output = arg.split("=")[1];
    } else if (arg.startsWith("--timeout=")) {
      options.timeout = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--extended") {
      options.extended = true;
    } else if (arg === "--headless") {
      options.headless = true;
    } else if (arg.startsWith("--model=")) {
      options.model = arg.split("=")[1];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Browser Automation Benchmark Runner

Usage:
  bun run benchmarks/runner.ts [options]

Options:
  --scenario=<id>     Run specific scenario only
                      Available: scraping, navigation, debugging, form-filling, search, structured-data
  --adapter=<name>    Run specific adapter only
                      Available: playwright-mcp, playwriter, firecrawl, browser-use, dev3000
  --runs=<n>          Number of runs per scenario (default: 1)
  --output=<path>     Output results to file (markdown or json based on extension)
  --json              Output results as JSON to stdout
  --verbose, -v       Show detailed output
  --extended          Include extended scenario variants
  --headless          Run browsers in headless mode
  --timeout=<ms>      Timeout per scenario in milliseconds (default: 60000)
  --model=<id>        LLM model ID (default: claude-opus-4-5)
  --help, -h          Show this help message

Examples:
  # Run all benchmarks
  bun run benchmarks/runner.ts

  # Run only scraping scenario
  bun run benchmarks/runner.ts --scenario=scraping

  # Run only playwright-mcp adapter
  bun run benchmarks/runner.ts --adapter=playwright-mcp

  # Run 3 times and output to file
  bun run benchmarks/runner.ts --runs=3 --output=results.md

  # Run in headless mode with JSON output
  bun run benchmarks/runner.ts --headless --json > results.json
`);
}

/**
 * Log with timestamp
 */
function log(message: string, verbose = false): void {
  if (!verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

/**
 * Run a single benchmark scenario with an adapter
 */
async function runScenario(
  adapter: BrowserAutomationAdapter,
  scenario: BenchmarkScenario,
  options: RunnerOptions
): Promise<BenchmarkResult> {
  // Check if adapter supports the scenario
  const supported = scenario.requiredCapabilities.every((cap) => adapter.supports(cap));

  if (!supported) {
    return {
      tool: adapter.name,
      scenario: scenario.id,
      success: false,
      duration: 0,
      error: `Adapter does not support required capabilities: ${scenario.requiredCapabilities.join(", ")}`,
    };
  }

  try {
    // Initialize adapter
    await adapter.setup({
      headless: options.headless,
      timeout: options.timeout,
    });

    // Run scenario setup if defined
    if (scenario.setup) {
      await scenario.setup();
    }

    // Run the benchmark
    const result = await Promise.race([
      scenario.run(adapter),
      new Promise<BenchmarkResult>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), options.timeout)
      ),
    ]);

    // Run scenario cleanup if defined
    if (scenario.cleanup) {
      await scenario.cleanup();
    }

    return result;
  } catch (error) {
    return {
      tool: adapter.name,
      scenario: scenario.id,
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    // Always cleanup adapter
    try {
      await adapter.cleanup();
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run all benchmarks
 */
async function runBenchmarks(options: RunnerOptions): Promise<BenchmarkRun> {
  const results: BenchmarkResult[] = [];
  const timestamp = new Date();

  // Determine which scenarios to run
  let scenarios: BenchmarkScenario[];
  if (options.scenario) {
    const scenario = getScenarioById(options.scenario);
    if (!scenario) {
      console.error(`Unknown scenario: ${options.scenario}`);
      process.exit(1);
    }
    scenarios = [scenario];
  } else {
    scenarios = options.extended ? allScenarios : primaryScenarios;
  }

  // Determine which adapters to run
  let adapterNames: AdapterName[];
  if (options.adapter) {
    if (!getAdapterNames().includes(options.adapter)) {
      console.error(`Unknown adapter: ${options.adapter}`);
      process.exit(1);
    }
    adapterNames = [options.adapter];
  } else {
    adapterNames = getAdapterNames();
  }

  // Check ccusage availability
  const ccusageAvailable = isCcusageAvailable();
  if (!ccusageAvailable && options.verbose) {
    log("Note: ccusage not available. Token tracking disabled.", true);
  }

  // Print header
  if (!options.json) {
    console.log("\n" + "=".repeat(60));
    console.log("  Browser Automation Benchmark");
    console.log("=".repeat(60));
    console.log(`\nScenarios: ${scenarios.map((s) => s.id).join(", ")}`);
    console.log(`Adapters: ${adapterNames.join(", ")}`);
    console.log(`Runs per scenario: ${options.runs}`);
    console.log(`Headless: ${options.headless}`);
    console.log(`Timeout: ${options.timeout}ms`);
    console.log("\n" + "-".repeat(60) + "\n");
  }

  // Run benchmarks
  for (const adapterName of adapterNames) {
    if (!options.json) {
      console.log(`\n📦 Adapter: ${adapterName}`);
      console.log(`   ${adapterMetadata[adapterName].description}\n`);
    }

    for (const scenario of scenarios) {
      if (!options.json) {
        console.log(`   🔬 Scenario: ${scenario.name}`);
      }

      for (let run = 0; run < options.runs; run++) {
        if (!options.json && options.runs > 1) {
          console.log(`      Run ${run + 1}/${options.runs}...`);
        }

        const adapter = createAdapter(adapterName);
        const result = await runScenario(adapter, scenario, options);
        results.push(result);

        if (!options.json) {
          const status = result.success ? "✅" : "❌";
          const time = (result.duration / 1000).toFixed(2);
          const quality = result.quality ? ` Quality: ${result.quality.overall.toFixed(1)}%` : "";
          console.log(`      ${status} ${time}s${quality}`);

          if (result.error && options.verbose) {
            console.log(`         Error: ${result.error}`);
          }
        }
      }
    }
  }

  // Generate summary
  const summary = aggregateResults(results);

  return {
    timestamp,
    options,
    results,
    summary,
  };
}

/**
 * Output results in various formats
 */
function outputResults(run: BenchmarkRun, options: RunnerOptions): void {
  if (options.json) {
    console.log(JSON.stringify(run, null, 2));
    return;
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("  Summary");
  console.log("=".repeat(60) + "\n");

  console.log(`Total runs: ${run.summary.totalRuns}`);
  console.log(`Success rate: ${run.summary.successRate.toFixed(1)}%`);
  console.log(`Average duration: ${(run.summary.avgDuration / 1000).toFixed(2)}s`);
  if (run.summary.avgTokens > 0) {
    console.log(`Average tokens: ${run.summary.avgTokens.toLocaleString()}`);
  }
  console.log(`Average quality: ${run.summary.avgQuality.toFixed(1)}%`);

  // Print per-tool summary
  console.log("\n--- By Tool ---\n");
  for (const [tool, stats] of Object.entries(run.summary.byTool)) {
    console.log(`${tool}:`);
    console.log(`  Success rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`  Avg duration: ${(stats.avgDuration / 1000).toFixed(2)}s`);
    console.log(`  Avg quality: ${stats.avgQuality.toFixed(1)}%`);
  }

  // Generate markdown results table
  console.log("\n--- Results Table ---\n");
  console.log(generateResultsTable(run.results));

  // Save to file if requested
  if (options.output) {
    const ext = path.extname(options.output);

    if (ext === ".json") {
      fs.writeFileSync(options.output, JSON.stringify(run, null, 2));
    } else {
      // Generate markdown report
      const markdown = generateMarkdownReport(run);
      fs.writeFileSync(options.output, markdown);
    }

    console.log(`\nResults saved to: ${options.output}`);
  }
}

/**
 * Generate a full markdown report
 */
function generateMarkdownReport(run: BenchmarkRun): string {
  const lines: string[] = [
    "# Browser Automation Benchmark Results",
    "",
    `**Date:** ${run.timestamp.toISOString()}`,
    "",
    "## Summary",
    "",
    `- **Total runs:** ${run.summary.totalRuns}`,
    `- **Success rate:** ${run.summary.successRate.toFixed(1)}%`,
    `- **Average duration:** ${(run.summary.avgDuration / 1000).toFixed(2)}s`,
    `- **Average quality:** ${run.summary.avgQuality.toFixed(1)}%`,
    "",
    "## Results by Tool",
    "",
  ];

  // Add per-tool summary
  for (const [tool, stats] of Object.entries(run.summary.byTool)) {
    lines.push(`### ${tool}`);
    lines.push("");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Success Rate | ${stats.successRate.toFixed(1)}% |`);
    lines.push(`| Avg Duration | ${(stats.avgDuration / 1000).toFixed(2)}s |`);
    lines.push(`| Avg Quality | ${stats.avgQuality.toFixed(1)}% |`);
    lines.push("");
  }

  // Add detailed results table
  lines.push("## Detailed Results");
  lines.push("");
  lines.push(generateResultsTable(run.results));
  lines.push("");

  // Add per-scenario comparison
  const scenarios = [...new Set(run.results.map((r) => r.scenario))];

  lines.push("## Scenario Comparisons");
  lines.push("");

  for (const scenario of scenarios) {
    const comparison = compareTools(run.results, scenario);
    lines.push(`### ${scenario}`);
    lines.push("");
    lines.push("| Rank | Tool | Success | Duration | Quality |");
    lines.push("|------|------|---------|----------|---------|");

    for (const entry of comparison.comparison) {
      const success = entry.success ? "✅" : "❌";
      const duration = (entry.duration / 1000).toFixed(2) + "s";
      const quality = entry.quality !== null ? `${entry.quality.toFixed(1)}%` : "N/A";
      lines.push(`| ${entry.rank} | ${entry.tool} | ${success} | ${duration} | ${quality} |`);
    }
    lines.push("");
  }

  // Add configuration
  lines.push("## Configuration");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(run.options, null, 2));
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  try {
    const run = await runBenchmarks(options);
    outputResults(run, options);

    // Exit with error code if any failures
    const hasFailures = run.results.some((r) => !r.success);
    process.exit(hasFailures ? 1 : 0);
  } catch (error) {
    console.error("Benchmark failed:", error);
    process.exit(1);
  }
}

// Run if executed directly
main();
