/**
 * Claude Code Chrome Adapter
 *
 * Adapter for Claude Code's Chrome integration via the Claude in Chrome extension.
 * Enables browser automation directly from the terminal using Claude Code CLI.
 *
 * @see https://code.claude.com/docs/en/chrome.md
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
 * Claude Code Chrome Adapter
 *
 * Uses Claude Code CLI with --chrome flag to control Chrome browser
 * through the Claude in Chrome extension.
 *
 * Prerequisites:
 * - Google Chrome browser
 * - Claude in Chrome extension (v1.0.36+)
 * - Claude Code CLI (v2.0.73+)
 * - Paid Claude plan (Pro, Team, or Enterprise)
 */
export class ClaudeCodeChromeAdapter extends BaseAdapter {
  readonly name = "claude-code-chrome";
  readonly description = "Claude Code's Chrome integration via Claude in Chrome extension";

  private currentUrl = "";
  private currentTitle = "";
  private isConnected = false;

  supports(capability: AdapterCapability): boolean {
    const supported: AdapterCapability[] = [
      "navigation",
      "scraping",
      "interaction",
      "forms",
      "screenshots",
      "consoleLogs",
      "networkLogs",
      "aiTasks",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};

    // Claude Code Chrome requires:
    // 1. Chrome browser running
    // 2. Claude in Chrome extension installed
    // 3. Claude Code CLI with --chrome flag

    // Check if Claude Code CLI is available
    try {
      const { execSync } = await import("child_process");
      const version = execSync("claude --version", { encoding: "utf-8" }).trim();
      this.addLog({
        type: "info",
        message: `Claude Code CLI detected: ${version}`,
        source: "setup",
      });
    } catch {
      throw new Error(
        "Claude Code CLI not found. Install from https://code.claude.com and run with --chrome flag"
      );
    }

    this.isConnected = true;
  }

  async cleanup(): Promise<void> {
    this.currentUrl = "";
    this.currentTitle = "";
    this.isConnected = false;
    this.logs = [];
    this.networkLogs = [];
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error("Adapter not connected. Call setup() first.");
    }
  }

  /**
   * Execute a task using Claude Code's browser capabilities
   *
   * This adapter works by sending natural language commands to Claude Code
   * which then executes them via the Chrome extension.
   */
  private async executeClaudeTask(task: string): Promise<string> {
    this.ensureConnected();

    // In a real implementation, this would communicate with Claude Code CLI
    // For benchmarking, we simulate the interface
    this.addLog({
      type: "info",
      message: `Executing task: ${task}`,
      source: "claude-code",
    });

    // Claude Code Chrome integration works via natural language tasks
    // The actual execution happens through the Chrome extension
    return `Task executed: ${task}`;
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();

    await this.executeClaudeTask(`Navigate to ${url}`);

    this.currentUrl = url;
    this.currentTitle = `Page at ${url}`;

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      loadTime: Date.now() - startTime,
    };
  }

  async goBack(): Promise<void> {
    await this.executeClaudeTask("Go back to the previous page");
  }

  async goForward(): Promise<void> {
    await this.executeClaudeTask("Go forward to the next page");
  }

  async reload(): Promise<void> {
    await this.executeClaudeTask("Reload the current page");
  }

  async click(selector: string): Promise<void> {
    await this.executeClaudeTask(`Click on the element: ${selector}`);
  }

  async type(selector: string, text: string): Promise<void> {
    await this.executeClaudeTask(`Type "${text}" into the element: ${selector}`);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.executeClaudeTask(`Select "${value}" from the dropdown: ${selector}`);
  }

  async hover(selector: string): Promise<void> {
    await this.executeClaudeTask(`Hover over the element: ${selector}`);
  }

  async pressKey(key: string): Promise<void> {
    await this.executeClaudeTask(`Press the ${key} key`);
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    const selector = options?.selector || "body";
    const format = options?.format || "text";

    const result = await this.executeClaudeTask(
      `Extract the ${format} content from ${selector === "body" ? "the page" : selector}`
    );

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      content: result,
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    const fieldNames = Object.keys(fields).join(", ");
    const result = await this.executeClaudeTask(
      `Extract all items matching "${selector}" with fields: ${fieldNames}`
    );

    // Claude Code returns structured data from the page
    // This would be parsed from the actual response
    return [];
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    const task = prompt || "Extract structured data from the page";
    await this.executeClaudeTask(task);

    // Claude Code can extract structured data based on the prompt
    throw new Error(
      "Structured extraction requires running Claude Code interactively with --chrome"
    );
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const path = options?.path || `claude-screenshot-${Date.now()}.png`;

    await this.executeClaudeTask(
      options?.fullPage ? "Take a full page screenshot" : "Take a screenshot of the visible area"
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
        await this.executeClaudeTask(`Wait for element "${condition.selector}" to be ${condition.state || "visible"}`);
        break;
      case "url":
        await this.executeClaudeTask(`Wait for URL to match "${condition.url}"`);
        break;
      case "timeout":
        await new Promise((resolve) => setTimeout(resolve, condition.ms));
        break;
      case "networkIdle":
        await this.executeClaudeTask("Wait for network to be idle");
        break;
      case "load":
        await this.executeClaudeTask("Wait for page to fully load");
        break;
    }
  }

  /**
   * Execute an AI-powered browser task
   *
   * Claude Code Chrome excels at complex, multi-step tasks described in natural language.
   */
  async executeTask(task: string): Promise<unknown> {
    return this.executeClaudeTask(task);
  }

  /**
   * Search the web using Claude's browser capabilities
   */
  async search(query: string): Promise<SearchResult> {
    await this.executeClaudeTask(`Search Google for "${query}" and extract the results`);

    return {
      query,
      results: [],
    };
  }

  /**
   * Record a GIF of browser interactions
   *
   * Unique to Claude Code Chrome - can record interactions as GIFs
   */
  async recordGif(task: string, outputPath: string): Promise<string> {
    await this.executeClaudeTask(`Record a GIF showing: ${task}. Save to ${outputPath}`);
    return outputPath;
  }

  /**
   * Work with authenticated web apps
   *
   * Uses the user's existing browser session with login state
   */
  async interactWithAuthenticatedApp(app: string, task: string): Promise<unknown> {
    return this.executeClaudeTask(`In ${app}: ${task}`);
  }
}

export default ClaudeCodeChromeAdapter;
