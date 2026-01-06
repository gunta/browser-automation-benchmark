/**
 * Browserbase MCP Server Adapter
 *
 * Adapter for mcp-server-browserbase - Browserbase's MCP server that
 * integrates Stagehand with cloud browser infrastructure.
 *
 * @see https://github.com/browserbase/mcp-server-browserbase
 * @see https://www.browserbase.com/mcp
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
 * Browserbase MCP Adapter
 *
 * mcp-server-browserbase integrates Stagehand with Browserbase's
 * cloud browser infrastructure via the Model Context Protocol.
 *
 * Key features:
 * - Cloud browser sessions (no local browser needed)
 * - Parallel session support
 * - Advanced stealth mode for anti-bot bypassing
 * - Proxy support
 * - Session persistence and context management
 * - Integration with Stagehand's AI capabilities
 */
export class BrowserbaseMCPAdapter extends BaseAdapter {
  readonly name = "browserbase-mcp";
  readonly description = "Browserbase MCP server with Stagehand AI and cloud browsers";

  private apiKey: string = "";
  private projectId: string = "";
  private currentUrl = "";
  private currentTitle = "";
  private sessionId: string | null = null;

  supports(capability: AdapterCapability): boolean {
    const supported: AdapterCapability[] = [
      "navigation",
      "scraping",
      "interaction",
      "forms",
      "screenshots",
      "consoleLogs",
      "networkLogs",
      "structuredExtraction",
      "aiTasks",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};

    this.apiKey = this.config.apiKey || process.env.BROWSERBASE_API_KEY || "";
    this.projectId = process.env.BROWSERBASE_PROJECT_ID || "";

    if (!this.apiKey) {
      throw new Error(
        "Browserbase API key is required. Set BROWSERBASE_API_KEY environment variable."
      );
    }

    // Create a new browser session
    await this.createSession();

    this.addLog({
      type: "info",
      message: `Browserbase session created: ${this.sessionId}`,
      source: "setup",
    });
  }

  async cleanup(): Promise<void> {
    if (this.sessionId) {
      await this.closeSession();
    }
    this.currentUrl = "";
    this.currentTitle = "";
    this.sessionId = null;
    this.logs = [];
    this.networkLogs = [];
  }

  private async createSession(): Promise<void> {
    // In real implementation, call Browserbase API to create session:
    // POST https://www.browserbase.com/v1/sessions
    // Headers: { "x-bb-api-key": this.apiKey }
    // Body: { projectId: this.projectId }

    this.sessionId = `bb-session-${Date.now()}`;
  }

  private async closeSession(): Promise<void> {
    // Close the Browserbase session
    this.sessionId = null;
  }

  private ensureSession(): void {
    if (!this.sessionId) {
      throw new Error("No active session. Call setup() first.");
    }
  }

  /**
   * Execute an MCP tool call
   *
   * mcp-server-browserbase exposes tools like:
   * - browserbase_create_session
   * - browserbase_navigate
   * - browserbase_screenshot
   * - browserbase_click
   * - browserbase_fill
   * - browserbase_evaluate
   * - stagehand_act
   * - stagehand_extract
   * - stagehand_observe
   */
  private async executeMCPTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
    this.ensureSession();

    this.addLog({
      type: "info",
      message: `MCP Tool: ${tool}(${JSON.stringify(args)})`,
      source: "browserbase-mcp",
    });

    // In real implementation, this would call the MCP server
    return { tool, args, sessionId: this.sessionId };
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();

    await this.executeMCPTool("browserbase_navigate", { url });

    this.currentUrl = url;
    this.currentTitle = `Page at ${url}`;

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      loadTime: Date.now() - startTime,
    };
  }

  async goBack(): Promise<void> {
    await this.executeMCPTool("browserbase_navigate", { action: "back" });
  }

  async goForward(): Promise<void> {
    await this.executeMCPTool("browserbase_navigate", { action: "forward" });
  }

  async reload(): Promise<void> {
    await this.executeMCPTool("browserbase_navigate", { action: "reload" });
  }

  async click(selector: string): Promise<void> {
    await this.executeMCPTool("browserbase_click", { selector });
  }

  async type(selector: string, text: string): Promise<void> {
    await this.executeMCPTool("browserbase_fill", { selector, value: text });
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.executeMCPTool("browserbase_select", { selector, value });
  }

  async hover(selector: string): Promise<void> {
    await this.executeMCPTool("browserbase_hover", { selector });
  }

  async pressKey(key: string): Promise<void> {
    await this.executeMCPTool("browserbase_press", { key });
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    const result = await this.executeMCPTool("browserbase_evaluate", {
      script: options?.format === "html"
        ? "document.body.innerHTML"
        : "document.body.innerText",
    });

    return {
      url: this.currentUrl,
      title: this.currentTitle,
      content: JSON.stringify(result),
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    const fieldNames = Object.keys(fields).join(", ");

    // Use Stagehand's extract capability
    await this.executeMCPTool("stagehand_extract", {
      instruction: `Extract all items matching "${selector}" with fields: ${fieldNames}`,
    });

    return [];
  }

  /**
   * Extract structured data using Stagehand via MCP
   */
  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    const instruction = prompt || "Extract structured data from the page";

    await this.executeMCPTool("stagehand_extract", {
      instruction,
      // Schema would be converted to JSON Schema format
    });

    throw new Error(
      "Structured extraction requires the Browserbase MCP server running."
    );
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const path = options?.path || `browserbase-screenshot-${Date.now()}.png`;

    await this.executeMCPTool("browserbase_screenshot", {
      fullPage: options?.fullPage,
      path,
    });

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
        await this.executeMCPTool("browserbase_wait", {
          selector: condition.selector,
          state: condition.state || "visible",
        });
        break;
      case "url":
        await this.executeMCPTool("browserbase_wait", { url: condition.url });
        break;
      case "timeout":
        await new Promise((resolve) => setTimeout(resolve, condition.ms));
        break;
      case "networkIdle":
        await this.executeMCPTool("browserbase_wait", { state: "networkidle" });
        break;
      case "load":
        await this.executeMCPTool("browserbase_wait", { state: "load" });
        break;
    }
  }

  /**
   * Execute an AI-powered task using Stagehand's act()
   */
  async executeTask(task: string): Promise<unknown> {
    return this.executeMCPTool("stagehand_act", { action: task });
  }

  /**
   * Observe the current page state using Stagehand
   */
  async observe(): Promise<unknown> {
    return this.executeMCPTool("stagehand_observe", {});
  }

  /**
   * Get the live view URL for the session
   *
   * Browserbase provides a live view URL to watch the browser in real-time
   */
  async getLiveViewUrl(): Promise<string> {
    this.ensureSession();
    return `https://www.browserbase.com/sessions/${this.sessionId}/live`;
  }

  /**
   * Get session recording
   *
   * Browserbase automatically records sessions
   */
  async getRecordingUrl(): Promise<string> {
    this.ensureSession();
    return `https://www.browserbase.com/sessions/${this.sessionId}/recording`;
  }
}

export default BrowserbaseMCPAdapter;
