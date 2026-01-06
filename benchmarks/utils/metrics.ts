/**
 * Browser Automation Benchmark - Metrics Collection
 *
 * Utilities for measuring time, quality, and other metrics during benchmarks.
 */

import { BenchmarkResult, QualityMetrics, ScrapedItem } from "../adapters/types.js";
import { TokenUsage } from "./ccusage.js";

/**
 * Timer for measuring execution duration
 */
export class Timer {
  private startTime: number = 0;
  private endTime: number = 0;
  private running = false;

  start(): void {
    this.startTime = performance.now();
    this.running = true;
  }

  stop(): number {
    if (!this.running) {
      throw new Error("Timer not started");
    }
    this.endTime = performance.now();
    this.running = false;
    return this.duration;
  }

  get duration(): number {
    if (this.running) {
      return performance.now() - this.startTime;
    }
    return this.endTime - this.startTime;
  }

  get durationSeconds(): number {
    return this.duration / 1000;
  }
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const timer = new Timer();
  timer.start();

  const result = await fn();

  const duration = timer.stop();
  return { result, duration };
}

/**
 * Calculate quality score for scraped items
 */
export function calculateScrapingQuality(
  actual: ScrapedItem[],
  expected: ScrapedItem[],
  requiredFields: string[]
): QualityMetrics {
  if (expected.length === 0) {
    return {
      accuracy: 0,
      completeness: 0,
      formatCorrectness: 0,
      overall: 0,
      details: "No expected items provided",
    };
  }

  // Accuracy: How many items match expected?
  let matchCount = 0;
  for (const expectedItem of expected) {
    const match = actual.find((item) =>
      requiredFields.every((field) => {
        const expectedValue = String(expectedItem[field] || "").toLowerCase().trim();
        const actualValue = String(item[field] || "").toLowerCase().trim();
        return expectedValue === actualValue || actualValue.includes(expectedValue);
      })
    );
    if (match) {
      matchCount++;
    }
  }
  const accuracy = (matchCount / expected.length) * 100;

  // Completeness: How many required fields are present?
  let totalFields = 0;
  let presentFields = 0;
  for (const item of actual) {
    for (const field of requiredFields) {
      totalFields++;
      if (item[field] !== undefined && item[field] !== null && item[field] !== "") {
        presentFields++;
      }
    }
  }
  const completeness = totalFields > 0 ? (presentFields / totalFields) * 100 : 0;

  // Format correctness: Are all items well-formed?
  let wellFormedCount = 0;
  for (const item of actual) {
    const hasAllRequired = requiredFields.every(
      (field) => item[field] !== undefined && item[field] !== null
    );
    if (hasAllRequired) {
      wellFormedCount++;
    }
  }
  const formatCorrectness = actual.length > 0 ? (wellFormedCount / actual.length) * 100 : 0;

  // Overall score (weighted average)
  const overall = accuracy * 0.5 + completeness * 0.3 + formatCorrectness * 0.2;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `${matchCount}/${expected.length} items matched, ${presentFields}/${totalFields} fields present`,
  };
}

/**
 * Calculate quality score for navigation tasks
 */
export function calculateNavigationQuality(
  actualUrls: string[],
  expectedUrls: string[],
  finalUrl: string,
  expectedFinalUrl: string
): QualityMetrics {
  // Check if we reached the expected final URL
  const reachedFinal = finalUrl === expectedFinalUrl || finalUrl.includes(expectedFinalUrl);
  const accuracy = reachedFinal ? 100 : 0;

  // Check how many intermediate URLs were visited
  let visitedCount = 0;
  for (const expected of expectedUrls) {
    if (actualUrls.some((url) => url.includes(expected))) {
      visitedCount++;
    }
  }
  const completeness = expectedUrls.length > 0 ? (visitedCount / expectedUrls.length) * 100 : 100;

  // Format correctness: All URLs are valid
  const validUrls = actualUrls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
  const formatCorrectness = actualUrls.length > 0 ? (validUrls.length / actualUrls.length) * 100 : 100;

  const overall = accuracy * 0.5 + completeness * 0.3 + formatCorrectness * 0.2;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `Reached final: ${reachedFinal}, Visited ${visitedCount}/${expectedUrls.length} intermediate URLs`,
  };
}

/**
 * Calculate quality score for debugging/log capture
 */
export function calculateDebuggingQuality(
  capturedErrors: number,
  expectedErrors: number,
  logCompleteness: number // 0-100
): QualityMetrics {
  // Accuracy: Did we find all expected errors?
  const accuracy = expectedErrors > 0 ? Math.min((capturedErrors / expectedErrors) * 100, 100) : 100;

  // Completeness is provided as a parameter (based on log types captured)
  const completeness = logCompleteness;

  // Format correctness: Errors should have proper format
  const formatCorrectness = capturedErrors > 0 ? 100 : 0;

  const overall = accuracy * 0.5 + completeness * 0.3 + formatCorrectness * 0.2;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `Captured ${capturedErrors}/${expectedErrors} errors, Log completeness: ${logCompleteness}%`,
  };
}

/**
 * Calculate quality score for form filling
 */
export function calculateFormQuality(
  filledFields: number,
  totalFields: number,
  validationsPassed: number,
  totalValidations: number
): QualityMetrics {
  const accuracy = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
  const completeness = accuracy; // Same as accuracy for forms
  const formatCorrectness = totalValidations > 0 ? (validationsPassed / totalValidations) * 100 : 100;

  const overall = accuracy * 0.4 + completeness * 0.3 + formatCorrectness * 0.3;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `Filled ${filledFields}/${totalFields} fields, ${validationsPassed}/${totalValidations} validations passed`,
  };
}

/**
 * Calculate quality score for search results
 */
export function calculateSearchQuality(
  foundAnswer: boolean,
  answerAccuracy: number, // 0-100
  resultCount: number
): QualityMetrics {
  const accuracy = foundAnswer ? answerAccuracy : 0;
  const completeness = foundAnswer ? 100 : 0;
  const formatCorrectness = resultCount > 0 ? 100 : 0;

  const overall = accuracy * 0.6 + completeness * 0.2 + formatCorrectness * 0.2;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `Answer found: ${foundAnswer}, Accuracy: ${answerAccuracy}%, Results: ${resultCount}`,
  };
}

/**
 * Calculate quality score for structured data extraction
 */
export function calculateStructuredQuality(
  schemaValid: boolean,
  fieldsFilled: number,
  totalFields: number,
  dataAccuracy: number // 0-100
): QualityMetrics {
  const accuracy = dataAccuracy;
  const completeness = totalFields > 0 ? (fieldsFilled / totalFields) * 100 : 0;
  const formatCorrectness = schemaValid ? 100 : 0;

  const overall = accuracy * 0.4 + completeness * 0.3 + formatCorrectness * 0.3;

  return {
    accuracy,
    completeness,
    formatCorrectness,
    overall,
    details: `Schema valid: ${schemaValid}, Fields: ${fieldsFilled}/${totalFields}, Data accuracy: ${dataAccuracy}%`,
  };
}

/**
 * Create a benchmark result object
 */
export function createBenchmarkResult(
  tool: string,
  scenario: string,
  success: boolean,
  duration: number,
  options?: {
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    error?: string;
    data?: unknown;
    quality?: QualityMetrics;
  }
): BenchmarkResult {
  return {
    tool,
    scenario,
    success,
    duration,
    tokensUsed: options?.tokensUsed,
    inputTokens: options?.inputTokens,
    outputTokens: options?.outputTokens,
    error: options?.error,
    data: options?.data,
    quality: options?.quality,
  };
}

/**
 * Format benchmark result for display
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const lines = [
    `Tool: ${result.tool}`,
    `Scenario: ${result.scenario}`,
    `Success: ${result.success ? "✅" : "❌"}`,
    `Duration: ${(result.duration / 1000).toFixed(2)}s`,
  ];

  if (result.tokensUsed !== undefined) {
    lines.push(`Tokens: ${result.tokensUsed.toLocaleString()}`);
  }

  if (result.quality) {
    lines.push(`Quality: ${result.quality.overall.toFixed(1)}%`);
    lines.push(`  - Accuracy: ${result.quality.accuracy.toFixed(1)}%`);
    lines.push(`  - Completeness: ${result.quality.completeness.toFixed(1)}%`);
    lines.push(`  - Format: ${result.quality.formatCorrectness.toFixed(1)}%`);
  }

  if (result.error) {
    lines.push(`Error: ${result.error}`);
  }

  return lines.join("\n");
}

/**
 * Aggregate multiple benchmark results
 */
export function aggregateResults(results: BenchmarkResult[]): {
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  avgTokens: number;
  avgQuality: number;
  byTool: Record<string, { successRate: number; avgDuration: number; avgQuality: number }>;
} {
  const totalRuns = results.length;
  const successCount = results.filter((r) => r.success).length;
  const successRate = totalRuns > 0 ? (successCount / totalRuns) * 100 : 0;

  const avgDuration =
    totalRuns > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / totalRuns : 0;

  const tokensResults = results.filter((r) => r.tokensUsed !== undefined);
  const avgTokens =
    tokensResults.length > 0
      ? tokensResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0) / tokensResults.length
      : 0;

  const qualityResults = results.filter((r) => r.quality !== undefined);
  const avgQuality =
    qualityResults.length > 0
      ? qualityResults.reduce((sum, r) => sum + (r.quality?.overall || 0), 0) / qualityResults.length
      : 0;

  // Group by tool
  const byTool: Record<string, BenchmarkResult[]> = {};
  for (const result of results) {
    if (!byTool[result.tool]) {
      byTool[result.tool] = [];
    }
    byTool[result.tool].push(result);
  }

  const toolStats: Record<string, { successRate: number; avgDuration: number; avgQuality: number }> = {};
  for (const [tool, toolResults] of Object.entries(byTool)) {
    const toolSuccess = toolResults.filter((r) => r.success).length;
    const toolQuality = toolResults.filter((r) => r.quality);

    toolStats[tool] = {
      successRate: toolResults.length > 0 ? (toolSuccess / toolResults.length) * 100 : 0,
      avgDuration: toolResults.reduce((sum, r) => sum + r.duration, 0) / toolResults.length,
      avgQuality:
        toolQuality.length > 0
          ? toolQuality.reduce((sum, r) => sum + (r.quality?.overall || 0), 0) / toolQuality.length
          : 0,
    };
  }

  return {
    totalRuns,
    successRate,
    avgDuration,
    avgTokens,
    avgQuality,
    byTool: toolStats,
  };
}

/**
 * Generate markdown table from results
 */
export function generateResultsTable(results: BenchmarkResult[]): string {
  const headers = ["Tool", "Success", "Duration (s)", "Tokens", "Quality"];
  const rows: string[][] = [];

  for (const result of results) {
    rows.push([
      result.tool,
      result.success ? "✅" : "❌",
      (result.duration / 1000).toFixed(2),
      result.tokensUsed?.toLocaleString() || "N/A",
      result.quality ? `${result.quality.overall.toFixed(1)}%` : "N/A",
    ]);
  }

  // Build markdown table
  let table = `| ${headers.join(" | ")} |\n`;
  table += `| ${headers.map(() => "---").join(" | ")} |\n`;
  for (const row of rows) {
    table += `| ${row.join(" | ")} |\n`;
  }

  return table;
}

/**
 * Compare results across tools for a scenario
 */
export function compareTools(
  results: BenchmarkResult[],
  scenario: string
): {
  scenario: string;
  comparison: Array<{
    tool: string;
    success: boolean;
    duration: number;
    tokens: number | null;
    quality: number | null;
    rank: number;
  }>;
} {
  const scenarioResults = results.filter((r) => r.scenario === scenario);

  // Calculate ranks based on overall score
  const scored = scenarioResults.map((r) => ({
    tool: r.tool,
    success: r.success,
    duration: r.duration,
    tokens: r.tokensUsed ?? null,
    quality: r.quality?.overall ?? null,
    // Score: success * 40 + quality * 30 + speed * 20 + efficiency * 10
    score:
      (r.success ? 40 : 0) +
      (r.quality?.overall || 0) * 0.3 +
      (r.success ? (1 / (r.duration / 1000)) * 20 : 0) +
      (r.tokensUsed ? (1 / r.tokensUsed) * 10000 : 0),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  const comparison = scored.map((s, i) => ({
    ...s,
    rank: i + 1,
  }));

  return { scenario, comparison };
}

export default {
  Timer,
  measureTime,
  calculateScrapingQuality,
  calculateNavigationQuality,
  calculateDebuggingQuality,
  calculateFormQuality,
  calculateSearchQuality,
  calculateStructuredQuality,
  createBenchmarkResult,
  formatBenchmarkResult,
  aggregateResults,
  generateResultsTable,
  compareTools,
};
