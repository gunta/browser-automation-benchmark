/**
 * Firecrawl Adapter
 *
 * Adapter for Firecrawl - web scraping API that converts websites
 * to LLM-ready markdown or structured data.
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
  SearchResult,
} from "./types.js";

// Type definitions for Firecrawl SDK
interface FirecrawlDocument {
  markdown?: string;
  html?: string;
  content?: string;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    statusCode?: number;
    [key: string]: unknown;
  };
  json?: unknown;
}

interface FirecrawlScrapeOptions {
  formats?: Array<"markdown" | "html" | "links" | "screenshot" | { type: "json"; schema?: unknown; prompt?: string }>;
  actions?: Array<{
    type: "wait" | "click" | "write" | "press" | "screenshot" | "scroll";
    milliseconds?: number;
    selector?: string;
    text?: string;
    key?: string;
  }>;
}

interface FirecrawlSearchOptions {
  limit?: number;
  scrapeOptions?: FirecrawlScrapeOptions;
}

export class FirecrawlAdapter extends BaseAdapter {
  readonly name = "firecrawl";
  readonly description = "Web scraping API - converts websites to LLM-ready markdown/structured data";

  private apiKey: string = "";
  private baseUrl = "https://api.firecrawl.dev/v2";
  private currentUrl = "";
  private currentDocument: FirecrawlDocument | null = null;

  supports(capability: AdapterCapability): boolean {
    const supported: AdapterCapability[] = [
      "scraping",
      "screenshots",
      "search",
      "structuredExtraction",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};
    this.apiKey = this.config.apiKey || process.env.FIRECRAWL_API_KEY || "";

    if (!this.apiKey) {
      throw new Error("Firecrawl API key is required. Set FIRECRAWL_API_KEY or pass apiKey in config.");
    }
  }

  async cleanup(): Promise<void> {
    this.currentDocument = null;
    this.currentUrl = "";
    this.logs = [];
    this.networkLogs = [];
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "POST",
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();

    // Firecrawl doesn't navigate like a browser - it scrapes
    // So we scrape the URL and store the result
    const result = await this.request<{ success: boolean; data: FirecrawlDocument }>("/scrape", "POST", {
      url,
      formats: ["markdown", "html"],
    });

    this.currentUrl = url;
    this.currentDocument = result.data;

    return {
      url,
      title: result.data.metadata?.title || "",
      loadTime: Date.now() - startTime,
    };
  }

  async click(selector: string): Promise<void> {
    // Firecrawl supports actions but requires re-scraping
    if (!this.currentUrl) {
      throw new Error("No URL loaded. Call navigate() first.");
    }

    const result = await this.request<{ success: boolean; data: FirecrawlDocument }>("/scrape", "POST", {
      url: this.currentUrl,
      formats: ["markdown", "html"],
      actions: [
        { type: "click", selector },
        { type: "wait", milliseconds: 1000 },
      ],
    });

    this.currentDocument = result.data;
  }

  async type(selector: string, text: string): Promise<void> {
    if (!this.currentUrl) {
      throw new Error("No URL loaded. Call navigate() first.");
    }

    const result = await this.request<{ success: boolean; data: FirecrawlDocument }>("/scrape", "POST", {
      url: this.currentUrl,
      formats: ["markdown", "html"],
      actions: [
        { type: "click", selector },
        { type: "write", text },
        { type: "wait", milliseconds: 500 },
      ],
    });

    this.currentDocument = result.data;
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    if (!this.currentDocument) {
      throw new Error("No document loaded. Call navigate() first.");
    }

    const format = options?.format || "markdown";

    return {
      url: this.currentUrl,
      title: this.currentDocument.metadata?.title || "",
      content: format === "html"
        ? this.currentDocument.html || ""
        : this.currentDocument.markdown || this.currentDocument.content || "",
      html: this.currentDocument.html,
      markdown: this.currentDocument.markdown,
      metadata: this.currentDocument.metadata,
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    // Firecrawl doesn't support DOM selector-based extraction
    // It uses LLM-based extraction instead
    throw new Error(
      "Firecrawl uses LLM-based extraction. Use extractStructured() with a schema instead."
    );
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    if (!this.currentUrl) {
      throw new Error("No URL loaded. Call navigate() first.");
    }

    // Convert Zod schema to JSON Schema
    const jsonSchema = this.zodToJsonSchema(schema);

    const result = await this.request<{ success: boolean; data: FirecrawlDocument }>("/scrape", "POST", {
      url: this.currentUrl,
      formats: [
        {
          type: "json",
          schema: jsonSchema,
          prompt,
        },
      ],
    });

    if (!result.data.json) {
      throw new Error("No structured data extracted");
    }

    // Validate with Zod
    return schema.parse(result.data.json);
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    if (!this.currentUrl) {
      throw new Error("No URL loaded. Call navigate() first.");
    }

    const result = await this.request<{ success: boolean; data: FirecrawlDocument }>("/scrape", "POST", {
      url: this.currentUrl,
      formats: ["screenshot"],
    });

    // Firecrawl returns screenshot as base64 in the response
    // For now, we return a placeholder
    return {
      path: options?.path || `firecrawl-screenshot-${Date.now()}.png`,
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
    return this.currentDocument?.metadata?.title || "";
  }

  /**
   * Firecrawl's search feature - search the web and optionally scrape results
   */
  async search(query: string): Promise<SearchResult> {
    const result = await this.request<{
      success: boolean;
      data: Array<{
        url: string;
        title: string;
        description?: string;
        markdown?: string;
      }>;
    }>("/search", "POST", {
      query,
      limit: 5,
    });

    return {
      query,
      results: result.data.map((item) => ({
        title: item.title,
        url: item.url,
        snippet: item.description || "",
      })),
    };
  }

  /**
   * Crawl an entire website
   */
  async crawl(url: string, options?: { limit?: number }): Promise<string> {
    const result = await this.request<{ success: boolean; id: string; url: string }>("/crawl", "POST", {
      url,
      limit: options?.limit || 10,
      scrapeOptions: {
        formats: ["markdown", "html"],
      },
    });

    return result.id;
  }

  /**
   * Check crawl job status
   */
  async getCrawlStatus(jobId: string): Promise<{
    status: string;
    total: number;
    completed: number;
    data?: FirecrawlDocument[];
  }> {
    return this.request(`/crawl/${jobId}`, "GET");
  }

  /**
   * Map a website to get all URLs
   */
  async map(url: string, options?: { search?: string }): Promise<string[]> {
    const result = await this.request<{
      success: boolean;
      links: Array<{ url: string; title?: string }>;
    }>("/map", "POST", {
      url,
      search: options?.search,
    });

    return result.links.map((link) => link.url);
  }

  /**
   * Convert Zod schema to JSON Schema (simplified)
   */
  private zodToJsonSchema(schema: z.ZodSchema): unknown {
    // This is a simplified conversion
    // In production, use a proper zod-to-json-schema library
    const zodType = (schema as any)._def;

    if (zodType.typeName === "ZodObject") {
      const shape = zodType.shape();
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodToJsonSchema(value as z.ZodSchema);
        if (!(value as any).isOptional?.()) {
          required.push(key);
        }
      }

      return {
        type: "object",
        properties,
        required,
      };
    }

    if (zodType.typeName === "ZodString") {
      return { type: "string" };
    }

    if (zodType.typeName === "ZodNumber") {
      return { type: "number" };
    }

    if (zodType.typeName === "ZodBoolean") {
      return { type: "boolean" };
    }

    if (zodType.typeName === "ZodArray") {
      return {
        type: "array",
        items: this.zodToJsonSchema(zodType.type),
      };
    }

    return { type: "string" };
  }
}

export default FirecrawlAdapter;
