/**
 * Playwriter Adapter
 *
 * Adapter for Playwriter - Chrome extension + MCP for browser automation.
 * Uses a single `execute` tool with full Playwright API access.
 * Claims 90% less context window usage than alternatives.
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { z } from "zod";
import {
  BaseAdapter,
  AdapterConfig,
  AdapterCapability,
  NavigationResult,
  ScrapedData,
  Screenshot,
  LogEntry,
  ScrapedItem,
  WaitCondition,
} from "./types.js";

/**
 * Playwriter uses a Chrome extension approach, but for benchmarking
 * we'll use Playwright directly to simulate the same capabilities.
 * In real usage, Playwriter connects to existing browser tabs via extension.
 */
export class PlaywriterAdapter extends BaseAdapter {
  readonly name = "playwriter";
  readonly description = "Chrome extension + MCP - full Playwright API via single execute tool";

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

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

    // Playwriter typically uses headed mode with real Chrome
    this.browser = await chromium.launch({
      headless: this.config.headless ?? false,
      channel: "chrome", // Use real Chrome like Playwriter does
    });

    this.context = await this.browser.newContext({
      viewport: this.config.viewport || { width: 1280, height: 720 },
      userAgent: this.config.userAgent,
    });

    this.page = await this.context.newPage();

    // Set up console log capture
    this.page.on("console", (msg) => {
      this.addLog({
        type: "console",
        message: msg.text(),
        level: msg.type(),
        source: "browser",
      });
    });

    // Set up error capture
    this.page.on("pageerror", (error) => {
      this.addLog({
        type: "error",
        message: error.message,
        source: "browser",
      });
    });

    // Set up network logging
    this.page.on("request", (request) => {
      this.addNetworkLog({
        message: `${request.method()} ${request.url()}`,
        url: request.url(),
        method: request.method(),
      });
    });

    this.page.on("response", (response) => {
      this.addNetworkLog({
        message: `${response.status()} ${response.url()}`,
        url: response.url(),
        statusCode: response.status(),
      });
    });

    if (this.config.timeout) {
      this.page.setDefaultTimeout(this.config.timeout);
    }
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.logs = [];
    this.networkLogs = [];
  }

  private ensurePage(): Page {
    if (!this.page) {
      throw new Error("Adapter not initialized. Call setup() first.");
    }
    return this.page;
  }

  async navigate(url: string): Promise<NavigationResult> {
    const page = this.ensurePage();
    const startTime = Date.now();

    await page.goto(url, { waitUntil: "networkidle" });

    return {
      url: page.url(),
      title: await page.title(),
      loadTime: Date.now() - startTime,
    };
  }

  async goBack(): Promise<void> {
    const page = this.ensurePage();
    await page.goBack();
  }

  async goForward(): Promise<void> {
    const page = this.ensurePage();
    await page.goForward();
  }

  async reload(): Promise<void> {
    const page = this.ensurePage();
    await page.reload();
  }

  async click(selector: string): Promise<void> {
    const page = this.ensurePage();
    await page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    const page = this.ensurePage();
    await page.fill(selector, text);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    const page = this.ensurePage();
    await page.selectOption(selector, value);
  }

  async hover(selector: string): Promise<void> {
    const page = this.ensurePage();
    await page.hover(selector);
  }

  async pressKey(key: string): Promise<void> {
    const page = this.ensurePage();
    await page.keyboard.press(key);
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    const page = this.ensurePage();
    const format = options?.format || "text";
    const selector = options?.selector || "body";

    let content: string;
    let html: string | undefined;

    if (format === "html") {
      content = await page.locator(selector).innerHTML();
      html = content;
    } else {
      content = await page.locator(selector).innerText();
      html = await page.locator(selector).innerHTML();
    }

    return {
      url: page.url(),
      title: await page.title(),
      content,
      html,
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    const page = this.ensurePage();
    const items: ScrapedItem[] = [];

    const elements = await page.locator(selector).all();

    for (const element of elements) {
      const item: ScrapedItem = { title: "" };

      for (const [fieldName, fieldSelector] of Object.entries(fields)) {
        try {
          const fieldElement = element.locator(fieldSelector);
          const text = await fieldElement.innerText();
          item[fieldName] = text.trim();

          if (fieldName === "title") {
            item.title = text.trim();
          }

          if (fieldName === "url") {
            const href = await fieldElement.getAttribute("href");
            if (href) {
              item.url = href;
            }
          }
        } catch {
          // Field not found, skip
        }
      }

      if (item.title) {
        items.push(item);
      }
    }

    return items;
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    throw new Error(
      "Structured extraction requires LLM integration. Use extractItems for simple extraction."
    );
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const page = this.ensurePage();
    const path = options?.path || `screenshot-${Date.now()}.png`;

    const buffer = await page.screenshot({
      fullPage: options?.fullPage,
      path,
    });

    const viewport = page.viewportSize();

    return {
      path,
      width: viewport?.width || 1280,
      height: viewport?.height || 720,
      format: "png",
      capturedAt: new Date(),
      base64: buffer.toString("base64"),
    };
  }

  async getCurrentUrl(): Promise<string> {
    const page = this.ensurePage();
    return page.url();
  }

  async getTitle(): Promise<string> {
    const page = this.ensurePage();
    return page.title();
  }

  async waitFor(condition: WaitCondition): Promise<void> {
    const page = this.ensurePage();

    switch (condition.type) {
      case "selector":
        await page.waitForSelector(condition.selector, {
          state: condition.state || "visible",
        });
        break;
      case "url":
        await page.waitForURL(condition.url);
        break;
      case "timeout":
        await page.waitForTimeout(condition.ms);
        break;
      case "networkIdle":
        await page.waitForLoadState("networkidle");
        break;
      case "load":
        await page.waitForLoadState("load");
        break;
    }
  }

  /**
   * Execute arbitrary Playwright code - Playwriter's key feature
   * This simulates the single `execute` tool that Playwriter exposes
   */
  async execute(code: string): Promise<unknown> {
    const page = this.ensurePage();

    // Create a function from the code string and execute it
    // In real Playwriter, this happens via the MCP execute tool
    const fn = new Function("page", "context", `return (async () => { ${code} })()`);

    return fn(page, this.context);
  }

  /**
   * Take screenshot with accessibility labels (Playwriter feature)
   */
  async screenshotWithAccessibilityLabels(options?: { path?: string }): Promise<Screenshot> {
    // In real Playwriter, this adds Vimium-style labels
    // For benchmarking, we just take a regular screenshot
    return this.screenshot(options);
  }

  /**
   * Get raw Playwright page for advanced operations
   */
  getPage(): Page {
    return this.ensurePage();
  }
}

export default PlaywriterAdapter;
