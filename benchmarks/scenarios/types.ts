/**
 * Browser Automation Benchmark - Scenario Type Definitions
 */

import { BrowserAutomationAdapter, BenchmarkResult, AdapterCapability } from "../adapters/types.js";

/**
 * Benchmark scenario definition
 */
export interface BenchmarkScenario {
  /** Unique identifier for the scenario */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what the scenario tests */
  description: string;

  /** Required adapter capabilities */
  requiredCapabilities: AdapterCapability[];

  /** Run the scenario with an adapter */
  run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult>;

  /** Optional setup before running */
  setup?(): Promise<void>;

  /** Optional cleanup after running */
  cleanup?(): Promise<void>;
}

/**
 * Scenario configuration options
 */
export interface ScenarioConfig {
  /** Timeout in milliseconds */
  timeout?: number;

  /** Number of times to repeat the scenario */
  runs?: number;

  /** Whether to capture screenshots */
  captureScreenshots?: boolean;

  /** Whether to capture network logs */
  captureNetworkLogs?: boolean;

  /** Custom test data */
  testData?: Record<string, unknown>;
}

/**
 * Expected result for validation
 */
export interface ExpectedResult {
  /** Expected data items */
  items?: unknown[];

  /** Expected final URL */
  finalUrl?: string;

  /** Expected errors to capture */
  errors?: number;

  /** Expected form fields */
  fields?: number;

  /** Custom validation function */
  validate?: (result: unknown) => boolean;
}

/**
 * Base class for benchmark scenarios
 */
export abstract class BaseScenario implements BenchmarkScenario {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract requiredCapabilities: AdapterCapability[];

  protected config: ScenarioConfig;
  protected expected: ExpectedResult;

  constructor(config?: ScenarioConfig, expected?: ExpectedResult) {
    this.config = config || {};
    this.expected = expected || {};
  }

  abstract run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult>;

  async setup(): Promise<void> {
    // Override in subclasses if needed
  }

  async cleanup(): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Check if adapter supports this scenario
   */
  isSupported(adapter: BrowserAutomationAdapter): boolean {
    return this.requiredCapabilities.every((cap) => adapter.supports(cap));
  }
}
