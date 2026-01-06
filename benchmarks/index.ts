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
 * Re-export runner constants
 */
export { DEFAULT_MODEL } from "./runner.js";

/**
 * Quick start function to run all benchmarks
 *
 * Note: For full benchmark functionality, use the CLI:
 * `bun run benchmarks/runner.ts`
 */
export async function runAllBenchmarks(options?: {
  adapters?: string[];
  scenarios?: string[];
  runs?: number;
  headless?: boolean;
}) {
  // Import runner dynamically to avoid circular deps
  // The runner is a CLI script - for programmatic use,
  // import the individual components directly
  console.log("Use the CLI to run benchmarks: bun run benchmarks/runner.ts");
  console.log("Options:", options);
}
