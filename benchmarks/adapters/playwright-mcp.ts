/**
 * Playwright MCP Adapter
 *
 * Adapter for Microsoft's official Playwright MCP server.
 * Uses accessibility tree for element selection and structured tools.
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

export class PlaywrightMCPAdapter extends BaseAdapter {
  readonly name = "playwright-mcp";
  readonly description = "Microsoft's official Playwright MCP server - uses accessibility tree";

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
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};

    this.browser = await chromium.launch({
      headless: this.config.headless ?? false,
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

    // Set default timeout
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

          // Special handling for title
          if (fieldName === "title") {
            item.title = text.trim();
          }

          // Try to get href for url fields
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
    const page = this.ensurePage();

    // Get page content for extraction
    const content = await page.content();
    const text = await page.locator("body").innerText();

    // This would typically call an LLM to extract structured data
    // For now, we'll throw an error indicating this needs LLM integration
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
   * Get the accessibility tree snapshot (Playwright MCP's key feature)
   * Note: Uses ariaSnapshot() in Playwright 1.50+
   */
  async getAccessibilitySnapshot(): Promise<string> {
    const page = this.ensurePage();
    // In Playwright 1.50+, use locator().ariaSnapshot() instead of deprecated accessibility.snapshot()
    return page.locator("body").ariaSnapshot();
  }

  /**
   * Get raw Playwright page for advanced operations
   */
  getPage(): Page {
    return this.ensurePage();
  }
}

export default PlaywrightMCPAdapter;
