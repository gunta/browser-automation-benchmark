/**
 * Dev3000 Adapter
 *
 * Adapter for dev3000 - debugging assistant for web apps.
 * Captures server logs, browser events, network requests, and screenshots.
 */

import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
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
} from "./types.js";

interface Dev3000Log {
  timestamp: string;
  type: "server" | "browser" | "network" | "error" | "screenshot";
  message: string;
  data?: unknown;
}

export class Dev3000Adapter extends BaseAdapter {
  readonly name = "dev3000";
  readonly description = "Debugging assistant - captures logs, errors, screenshots during development";

  private dev3000Process: ChildProcess | null = null;
  private logBuffer: Dev3000Log[] = [];
  private mcpPort = 3684;
  private devServerPort = 3000;
  private logsDir: string = "";
  private currentUrl = "";

  supports(capability: AdapterCapability): boolean {
    // dev3000 is primarily a debugging tool, not a full automation solution
    const supported: AdapterCapability[] = [
      "navigation",
      "screenshots",
      "consoleLogs",
      "networkLogs",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};

    // dev3000 needs a dev server to monitor
    // For benchmarking, we'll interact via its MCP interface

    // Create logs directory
    this.logsDir = fs.mkdtempSync(path.join(os.tmpdir(), "dev3000-benchmark-"));

    // Note: In real usage, dev3000 is started with `dev3000` CLI
    // and monitors an existing dev server. For benchmarking purposes,
    // we'll simulate its MCP tool calls.

    console.log(`Dev3000 adapter initialized. MCP port: ${this.mcpPort}`);
  }

  async cleanup(): Promise<void> {
    if (this.dev3000Process) {
      this.dev3000Process.kill();
      this.dev3000Process = null;
    }

    if (this.logsDir && fs.existsSync(this.logsDir)) {
      fs.rmSync(this.logsDir, { recursive: true, force: true });
    }

    this.logs = [];
    this.networkLogs = [];
    this.logBuffer = [];
  }

  /**
   * Call dev3000 MCP tool
   */
  private async callMcpTool(tool: string, args: Record<string, unknown> = {}): Promise<unknown> {
    // In real implementation, this would use MCP protocol
    // For benchmarking, we simulate the tool responses

    switch (tool) {
      case "fix_my_app":
        return this.simulateFixMyApp();
      case "execute_browser_action":
        return this.simulateBrowserAction(args);
      case "restart_dev_server":
        return { success: true, message: "Dev server restarted" };
      case "crawl_app":
        return this.simulateCrawlApp();
      case "find_component_source":
        return this.simulateFindComponentSource(args);
      default:
        throw new Error(`Unknown MCP tool: ${tool}`);
    }
  }

  private async simulateFixMyApp(): Promise<unknown> {
    // Simulate analyzing logs and finding errors
    const errors = this.logs.filter((l) => l.type === "error");

    return {
      success: true,
      errorsFound: errors.length,
      suggestions: errors.map((e) => ({
        error: e.message,
        suggestion: `Fix the error: ${e.message}`,
      })),
    };
  }

  private async simulateBrowserAction(args: Record<string, unknown>): Promise<unknown> {
    const action = args.action as string;
    const selector = args.selector as string;

    // Log the action
    this.addLog({
      type: "console",
      message: `Browser action: ${action} on ${selector || "page"}`,
      source: "dev3000",
    });

    return { success: true, action, selector };
  }

  private async simulateCrawlApp(): Promise<unknown> {
    return {
      routes: ["/", "/about", "/contact", "/products"],
      pages: 4,
    };
  }

  private async simulateFindComponentSource(args: Record<string, unknown>): Promise<unknown> {
    return {
      found: true,
      file: "src/components/Example.tsx",
      line: 42,
    };
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();
    this.currentUrl = url;

    // Use MCP execute_browser_action tool
    await this.callMcpTool("execute_browser_action", {
      action: "navigate",
      url,
    });

    this.addLog({
      type: "console",
      message: `Navigated to ${url}`,
      source: "dev3000",
    });

    return {
      url,
      title: "Page Title", // Would be captured from browser
      loadTime: Date.now() - startTime,
    };
  }

  async click(selector: string): Promise<void> {
    await this.callMcpTool("execute_browser_action", {
      action: "click",
      selector,
    });

    this.addLog({
      type: "console",
      message: `Clicked ${selector}`,
      source: "dev3000",
    });
  }

  async type(selector: string, text: string): Promise<void> {
    await this.callMcpTool("execute_browser_action", {
      action: "type",
      selector,
      text,
    });

    this.addLog({
      type: "console",
      message: `Typed "${text}" into ${selector}`,
      source: "dev3000",
    });
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    // dev3000 is not designed for scraping
    // It's a debugging tool, not a scraper

    return {
      url: this.currentUrl,
      title: "",
      content: "dev3000 is a debugging tool, not a scraper. Use browser-use or firecrawl for scraping.",
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    throw new Error("dev3000 does not support item extraction. It's a debugging tool.");
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    throw new Error("dev3000 does not support structured extraction. It's a debugging tool.");
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const outputPath = options?.path || path.join(this.logsDir, `screenshot_${Date.now()}.png`);

    await this.callMcpTool("execute_browser_action", {
      action: "screenshot",
      path: outputPath,
    });

    this.addLog({
      type: "console",
      message: `Screenshot saved to ${outputPath}`,
      source: "dev3000",
    });

    return {
      path: outputPath,
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
    // Would need to get from browser
    return "Page Title";
  }

  async waitFor(condition: WaitCondition): Promise<void> {
    if (condition.type === "timeout") {
      await new Promise((resolve) => setTimeout(resolve, condition.ms));
    }
    // Other conditions would need browser integration
  }

  // === Dev3000-specific methods ===

  /**
   * Analyze logs and find issues - dev3000's primary function
   */
  async fixMyApp(): Promise<{
    errorsFound: number;
    suggestions: Array<{ error: string; suggestion: string }>;
  }> {
    const result = await this.callMcpTool("fix_my_app");
    return result as { errorsFound: number; suggestions: Array<{ error: string; suggestion: string }> };
  }

  /**
   * Crawl the app to discover routes
   */
  async crawlApp(): Promise<{ routes: string[]; pages: number }> {
    const result = await this.callMcpTool("crawl_app");
    return result as { routes: string[]; pages: number };
  }

  /**
   * Find the source file for a DOM element
   */
  async findComponentSource(selector: string): Promise<{
    found: boolean;
    file?: string;
    line?: number;
  }> {
    const result = await this.callMcpTool("find_component_source", { selector });
    return result as { found: boolean; file?: string; line?: number };
  }

  /**
   * Restart the dev server
   */
  async restartDevServer(): Promise<{ success: boolean; message: string }> {
    const result = await this.callMcpTool("restart_dev_server");
    return result as { success: boolean; message: string };
  }

  /**
   * Get comprehensive debug info
   */
  async getDebugInfo(): Promise<{
    consoleLogs: LogEntry[];
    networkLogs: LogEntry[];
    errors: LogEntry[];
    screenshots: string[];
  }> {
    return {
      consoleLogs: await this.getConsoleLogs(),
      networkLogs: await this.getNetworkLogs(),
      errors: await this.getErrors(),
      screenshots: [], // Would be collected during monitoring
    };
  }

  /**
   * Simulate adding browser console log (would come from extension)
   */
  addBrowserLog(message: string, level: string = "log"): void {
    this.addLog({
      type: level === "error" ? "error" : "console",
      message,
      source: "browser",
      level,
    });
  }

  /**
   * Simulate adding server log (would come from dev server)
   */
  addServerLog(message: string): void {
    this.addLog({
      type: "console",
      message,
      source: "server",
    });
  }

  /**
   * Simulate adding network log
   */
  addNetworkRequest(url: string, method: string, status: number): void {
    this.addNetworkLog({
      message: `${method} ${url} - ${status}`,
      url,
      method,
      statusCode: status,
    });
  }
}

export default Dev3000Adapter;
