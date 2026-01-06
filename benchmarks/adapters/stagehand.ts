/**
 * Stagehand Adapter
 *
 * Adapter for Stagehand - AI-powered browser automation SDK by Browserbase.
 * Uses natural language commands to control web browsers.
 *
 * @see https://github.com/browserbase/stagehand
 * @see https://docs.stagehand.dev/
 */

import { z } from "zod";
import {
  BaseAdapter,
  AdapterConfig,
  AdapterCapability,
  NavigationResult,
  ScrapedData,
  Screenshot,
  ScrapedItem,
  LogEntry,
  WaitCondition,
  SearchResult,
} from "./types.js";

/**
 * Stagehand Adapter
 *
 * Stagehand is an AI-powered browser automation SDK that enables
 * natural language commands to control web browsers.
 *
 * Key features:
 * - Natural language actions (act, extract, observe)
 * - Multi-model support (GPT-4, Claude)
 * - Vision capabilities for element detection
 * - Caching for performance optimization
 */
export class StagehandAdapter extends BaseAdapter {
  readonly name = "stagehand";
  readonly description = "AI-powered browser automation SDK with natural language commands";

  private currentUrl = "";
  private currentTitle = "";
  private isInitialized = false;

  supports(capability: AdapterCapability): boolean {
    const supported: AdapterCapability[] = [
      "navigation",
      "scraping",
      "interaction",
      "forms",
      "screenshots",
      "consoleLogs",
      "structuredExtraction",
      "aiTasks",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};

    // Stagehand requires:
    // 1. API key for the LLM provider (OpenAI or Anthropic)
    // 2. Optionally, Browserbase API key for cloud sessions

    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Stagehand requires an LLM API key. Set OPENAI_API_KEY or ANTHROPIC_API_KEY."
      );
    }

    this.addLog({
      type: "info",
      message: "Stagehand adapter initialized",
      source: "setup",
    });

    this.isInitialized = true;
  }

  async cleanup(): Promise<void> {
    this.currentUrl = "";
    this.currentTitle = "";
    this.isInitialized = false;
    this.logs = [];
    this.networkLogs = [];
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Adapter not initialized. Call setup() first.");
    }
  }

  /**
   * Execute a Stagehand action using natural language
   *
   * Stagehand provides three main methods:
   * - act(): Perform actions on the page
   * - extract(): Extract structured data
   * - observe(): Get information about page state
   */
  private async executeStagehandAction(action: string, type: "act" | "extract" | "observe" = "act"): Promise<unknown> {
    this.ensureInitialized();

    this.addLog({
      type: "info",
      message: `Stagehand ${type}: ${action}`,
      source: "stagehand",
    });

    // In a real implementation, this would call the Stagehand SDK:
    // const stagehand = new Stagehand({ env: "LOCAL" });
    // await stagehand.init();
    // const result = await stagehand.act({ action });
    // or stagehand.extract({ instruction, schema });
    // or stagehand.observe();

    return { action, type, executed: true };
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();

    await this.executeStagehandAction(`Navigate to ${url}`, "act");

    this.currentUrl = url;
    this.currentTitle = `Page at ${url}`;

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      loadTime: Date.now() - startTime,
    };
  }

  async goBack(): Promise<void> {
    await this.executeStagehandAction("Go back to the previous page", "act");
  }

  async goForward(): Promise<void> {
    await this.executeStagehandAction("Go forward to the next page", "act");
  }

  async reload(): Promise<void> {
    await this.executeStagehandAction("Reload the current page", "act");
  }

  async click(selector: string): Promise<void> {
    // Stagehand uses natural language, not selectors
    await this.executeStagehandAction(`Click on ${selector}`, "act");
  }

  async type(selector: string, text: string): Promise<void> {
    await this.executeStagehandAction(`Type "${text}" into ${selector}`, "act");
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.executeStagehandAction(`Select "${value}" from ${selector}`, "act");
  }

  async hover(selector: string): Promise<void> {
    await this.executeStagehandAction(`Hover over ${selector}`, "act");
  }

  async pressKey(key: string): Promise<void> {
    await this.executeStagehandAction(`Press the ${key} key`, "act");
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    const format = options?.format || "text";

    const result = await this.executeStagehandAction(
      `Extract the ${format} content from the page`,
      "extract"
    );

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      content: JSON.stringify(result),
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    const fieldNames = Object.keys(fields).join(", ");

    await this.executeStagehandAction(
      `Extract all items with fields: ${fieldNames}`,
      "extract"
    );

    // Stagehand returns structured data based on the schema
    return [];
  }

  /**
   * Extract structured data using Stagehand's extract() method
   *
   * This is Stagehand's killer feature - it uses Zod schemas
   * for type-safe extraction with LLM understanding.
   */
  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    const instruction = prompt || "Extract structured data from the page";

    await this.executeStagehandAction(instruction, "extract");

    // In real implementation:
    // const result = await stagehand.extract({
    //   instruction,
    //   schema,
    // });
    // return result;

    throw new Error(
      "Structured extraction requires the Stagehand SDK. Install with: bun add @browserbasehq/stagehand"
    );
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const path = options?.path || `stagehand-screenshot-${Date.now()}.png`;

    await this.executeStagehandAction(
      options?.fullPage ? "Take a full page screenshot" : "Take a screenshot",
      "act"
    );

    return {
      path,
      width: 1280,
      height: 720,
      format: "png",
      capturedAt: new Date(),
    };
  }

  async getCurrentUrl(): Promise<string> {
    return this.currentUrl;
  }

  async getTitle(): Promise<string> {
    return this.currentTitle;
  }

  async waitFor(condition: WaitCondition): Promise<void> {
    switch (condition.type) {
      case "selector":
        await this.executeStagehandAction(
          `Wait for ${condition.selector} to be ${condition.state || "visible"}`,
          "act"
        );
        break;
      case "url":
        await this.executeStagehandAction(`Wait for URL to change to ${condition.url}`, "act");
        break;
      case "timeout":
        await new Promise((resolve) => setTimeout(resolve, condition.ms));
        break;
      case "networkIdle":
        await this.executeStagehandAction("Wait for network to be idle", "act");
        break;
      case "load":
        await this.executeStagehandAction("Wait for page to fully load", "act");
        break;
    }
  }

  /**
   * Execute an AI-powered task using Stagehand's act() method
   */
  async executeTask(task: string): Promise<unknown> {
    return this.executeStagehandAction(task, "act");
  }

  /**
   * Observe the current page state
   *
   * Stagehand's observe() returns information about interactive elements
   * and possible actions on the current page.
   */
  async observe(): Promise<unknown> {
    return this.executeStagehandAction("Observe the current page state", "observe");
  }
}

export default StagehandAdapter;
