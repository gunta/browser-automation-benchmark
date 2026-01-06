/**
 * Browser Automation Benchmark
 *
 * Comprehensive benchmark suite for browser automation tools.
 */

// Adapters
export * from "./adapters/index.js";

// Scenarios
export * from "./scenarios/index.js";

// Utilities
export * from "./utils/index.js";

// Version
export const VERSION = "1.0.0";

/**
 * Quick start function to run all benchmarks
 */
export async function runAllBenchmarks(options?: {
  adapters?: string[];
  scenarios?: string[];
  runs?: number;
  headless?: boolean;
}) {
  // Import runner dynamically to avoid circular deps
  const { default: runner } = await import("./runner.js");
  // Runner is self-executing, this is just for programmatic usage
}
