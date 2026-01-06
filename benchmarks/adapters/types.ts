/**
 * Browser Automation Benchmark - Adapter Type Definitions
 *
 * Unified interface for all browser automation tools being benchmarked.
 * Each tool implements this interface to allow fair comparison.
 */

import { z } from "zod";

/**
 * Scraped data from a web page
 */
export interface ScrapedData {
  url: string;
  title: string;
  content: string;
  html?: string;
  markdown?: string;
  metadata?: Record<string, unknown>;
  extractedAt: Date;
}

/**
 * Single scraped item (e.g., a Hacker News story)
 */
export interface ScrapedItem {
  title: string;
  url?: string;
  author?: string;
  points?: number;
  comments?: number;
  [key: string]: unknown;
}

/**
 * Log entry from browser console or network
 */
export interface LogEntry {
  type: "console" | "network" | "error" | "warning" | "info";
  message: string;
  timestamp: Date;
  source?: string;
  level?: string;
  url?: string;
  statusCode?: number;
  method?: string;
}

/**
 * Screenshot capture result
 */
export interface Screenshot {
  path: string;
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp";
  capturedAt: Date;
  base64?: string;
}

/**
 * Form field definition for form filling
 */
export interface FormField {
  selector: string;
  value: string;
  type: "text" | "email" | "password" | "select" | "checkbox" | "radio" | "textarea";
}

/**
 * Structured data extraction schema
 */
export const ProductSchema = z.object({
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  availability: z.enum(["in_stock", "out_of_stock", "preorder"]).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Benchmark result for a single run
 */
export interface BenchmarkResult {
  tool: string;
  scenario: string;
  success: boolean;
  duration: number; // milliseconds
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
  data?: unknown;
  quality?: QualityMetrics;
}

/**
 * Quality metrics for benchmark evaluation
 */
export interface QualityMetrics {
  accuracy: number; // 0-100
  completeness: number; // 0-100
  formatCorrectness: number; // 0-100
  overall: number; // 0-100 weighted average
  details?: string;
}

/**
 * Adapter configuration options
 */
export interface AdapterConfig {
  headless?: boolean;
  timeout?: number; // milliseconds
  userAgent?: string;
  viewport?: { width: number; height: number };
  proxy?: string;
  apiKey?: string;
}

/**
 * Navigation result
 */
export interface NavigationResult {
  url: string;
  title: string;
  loadTime: number;
  screenshot?: Screenshot;
}

/**
 * Search result from web search
 */
export interface SearchResult {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

/**
 * Unified Browser Automation Adapter Interface
 *
 * All tool adapters must implement this interface to participate in benchmarks.
 */
export interface BrowserAutomationAdapter {
  /** Unique identifier for this adapter */
  readonly name: string;

  /** Human-readable description */
  readonly description: string;

  /** Whether this adapter supports a given capability */
  supports(capability: AdapterCapability): boolean;

  /**
   * Initialize the adapter and browser
   */
  setup(config?: AdapterConfig): Promise<void>;

  /**
   * Clean up resources
   */
  cleanup(): Promise<void>;

  // === Core Navigation ===

  /**
   * Navigate to a URL
   */
  navigate(url: string): Promise<NavigationResult>;

  /**
   * Go back in browser history
   */
  goBack(): Promise<void>;

  /**
   * Go forward in browser history
   */
  goForward(): Promise<void>;

  /**
   * Reload the current page
   */
  reload(): Promise<void>;

  // === Interaction ===

  /**
   * Click on an element
   */
  click(selector: string): Promise<void>;

  /**
   * Type text into an element
   */
  type(selector: string, text: string): Promise<void>;

  /**
   * Fill a form with multiple fields
   */
  fillForm(fields: FormField[]): Promise<void>;

  /**
   * Select an option from a dropdown
   */
  selectOption(selector: string, value: string): Promise<void>;

  /**
   * Hover over an element
   */
  hover(selector: string): Promise<void>;

  /**
   * Press a keyboard key
   */
  pressKey(key: string): Promise<void>;

  // === Data Extraction ===

  /**
   * Scrape content from the current page
   */
  scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData>;

  /**
   * Extract multiple items (e.g., list of articles)
   */
  extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]>;

  /**
   * Extract structured data using a schema
   */
  extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T>;

  // === Debugging & Logging ===

  /**
   * Get console logs from the browser
   */
  getConsoleLogs(): Promise<LogEntry[]>;

  /**
   * Get network request logs
   */
  getNetworkLogs(): Promise<LogEntry[]>;

  /**
   * Get all captured errors
   */
  getErrors(): Promise<LogEntry[]>;

  // === Screenshots ===

  /**
   * Take a screenshot of the current page
   */
  screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot>;

  // === Search ===

  /**
   * Perform a web search and extract results
   */
  search?(query: string): Promise<SearchResult>;

  // === Advanced ===

  /**
   * Execute arbitrary code/task (for AI agents)
   */
  executeTask?(task: string): Promise<unknown>;

  /**
   * Get the current page URL
   */
  getCurrentUrl(): Promise<string>;

  /**
   * Get the current page title
   */
  getTitle(): Promise<string>;

  /**
   * Wait for a condition
   */
  waitFor(condition: WaitCondition): Promise<void>;
}

/**
 * Capabilities that adapters can support
 */
export type AdapterCapability =
  | "navigation"
  | "scraping"
  | "interaction"
  | "forms"
  | "screenshots"
  | "consoleLogs"
  | "networkLogs"
  | "search"
  | "structuredExtraction"
  | "aiTasks";

/**
 * Wait condition for waitFor method
 */
export type WaitCondition =
  | { type: "selector"; selector: string; state?: "visible" | "hidden" | "attached" }
  | { type: "url"; url: string | RegExp }
  | { type: "timeout"; ms: number }
  | { type: "networkIdle" }
  | { type: "load" };

/**
 * Base class with common functionality for adapters
 */
export abstract class BaseAdapter implements BrowserAutomationAdapter {
  abstract readonly name: string;
  abstract readonly description: string;

  protected config: AdapterConfig = {};
  protected logs: LogEntry[] = [];
  protected networkLogs: LogEntry[] = [];

  abstract setup(config?: AdapterConfig): Promise<void>;
  abstract cleanup(): Promise<void>;
  abstract navigate(url: string): Promise<NavigationResult>;
  abstract click(selector: string): Promise<void>;
  abstract type(selector: string, text: string): Promise<void>;
  abstract scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData>;
  abstract screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot>;
  abstract getCurrentUrl(): Promise<string>;
  abstract getTitle(): Promise<string>;

  supports(capability: AdapterCapability): boolean {
    // Override in subclasses to indicate supported capabilities
    const baseCapabilities: AdapterCapability[] = ["navigation", "scraping", "screenshots"];
    return baseCapabilities.includes(capability);
  }

  async goBack(): Promise<void> {
    throw new Error("goBack not implemented");
  }

  async goForward(): Promise<void> {
    throw new Error("goForward not implemented");
  }

  async reload(): Promise<void> {
    throw new Error("reload not implemented");
  }

  async fillForm(fields: FormField[]): Promise<void> {
    for (const field of fields) {
      if (field.type === "checkbox" || field.type === "radio") {
        await this.click(field.selector);
      } else if (field.type === "select") {
        await this.selectOption(field.selector, field.value);
      } else {
        await this.type(field.selector, field.value);
      }
    }
  }

  async selectOption(selector: string, value: string): Promise<void> {
    throw new Error("selectOption not implemented");
  }

  async hover(selector: string): Promise<void> {
    throw new Error("hover not implemented");
  }

  async pressKey(key: string): Promise<void> {
    throw new Error("pressKey not implemented");
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    throw new Error("extractItems not implemented");
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    throw new Error("extractStructured not implemented");
  }

  async getConsoleLogs(): Promise<LogEntry[]> {
    return this.logs.filter((l) => l.type === "console");
  }

  async getNetworkLogs(): Promise<LogEntry[]> {
    return this.networkLogs;
  }

  async getErrors(): Promise<LogEntry[]> {
    return this.logs.filter((l) => l.type === "error");
  }

  async waitFor(condition: WaitCondition): Promise<void> {
    if (condition.type === "timeout") {
      await new Promise((resolve) => setTimeout(resolve, condition.ms));
    } else {
      throw new Error(`waitFor condition ${condition.type} not implemented`);
    }
  }

  protected addLog(entry: Omit<LogEntry, "timestamp">): void {
    this.logs.push({ ...entry, timestamp: new Date() });
  }

  protected addNetworkLog(entry: Omit<LogEntry, "timestamp" | "type">): void {
    this.networkLogs.push({ ...entry, type: "network", timestamp: new Date() });
  }
}
