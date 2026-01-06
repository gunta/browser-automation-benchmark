/**
 * Browser Automation Benchmark - Structured Data Extraction Scenario
 *
 * Task: Extract product data from an e-commerce page into a JSON schema
 */

import { z } from "zod";
import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
  ProductSchema,
  Product,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig } from "./types.js";
import {
  measureTime,
  calculateStructuredQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";

/**
 * Article schema for testing structured extraction
 */
export const ArticleSchema = z.object({
  title: z.string(),
  author: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;

/**
 * Book schema for testing
 */
export const BookSchema = z.object({
  title: z.string(),
  author: z.string(),
  price: z.number().optional(),
  rating: z.number().optional(),
  availability: z.string().optional(),
  description: z.string().optional(),
});

export type Book = z.infer<typeof BookSchema>;

/**
 * Structured Data Extraction Benchmark Scenario
 */
export class StructuredDataScenario extends BaseScenario {
  id = "structured-data";
  name = "Structured Data Extraction";
  description = "Extract product data from e-commerce page into JSON schema";
  requiredCapabilities: AdapterCapability[] = ["navigation", "scraping", "structuredExtraction"];

  // Using Books to Scrape - a test site designed for scraping practice
  private testUrl = "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html";

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    try {
      // Check if adapter supports structured extraction
      if (!adapter.supports("structuredExtraction")) {
        return this.runWithManualExtraction(adapter);
      }

      return this.runWithStructuredExtraction(adapter);
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Run with adapter's native structured extraction
   */
  private async runWithStructuredExtraction(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const { result, duration } = await measureTime(async () => {
      await adapter.navigate(this.testUrl);
      await adapter.waitFor({ type: "load" });

      try {
        const book = await adapter.extractStructured(BookSchema, "Extract the book details from this product page");
        return { book, method: "structured" };
      } catch (structuredError) {
        // Fall back to manual extraction
        const book = await this.manuallyExtractBook(adapter);
        return { book, method: "manual" };
      }
    });

    const { valid, fieldsFilled, totalFields } = this.validateBook(result.book);
    const dataAccuracy = this.calculateBookAccuracy(result.book);

    const quality = calculateStructuredQuality(valid, fieldsFilled, totalFields, dataAccuracy);

    return createBenchmarkResult(adapter.name, this.id, true, duration, {
      data: {
        ...result,
        validation: { valid, fieldsFilled, totalFields },
      },
      quality,
    });
  }

  /**
   * Run with manual DOM-based extraction
   */
  private async runWithManualExtraction(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const { result, duration } = await measureTime(async () => {
      await adapter.navigate(this.testUrl);
      await adapter.waitFor({ type: "load" });

      const book = await this.manuallyExtractBook(adapter);
      return { book, method: "manual" };
    });

    const { valid, fieldsFilled, totalFields } = this.validateBook(result.book);
    const dataAccuracy = this.calculateBookAccuracy(result.book);

    const quality = calculateStructuredQuality(valid, fieldsFilled, totalFields, dataAccuracy);

    return createBenchmarkResult(adapter.name, this.id, true, duration, {
      data: result,
      quality,
    });
  }

  /**
   * Manually extract book data from the page
   */
  private async manuallyExtractBook(adapter: BrowserAutomationAdapter): Promise<Partial<Book>> {
    const content = await adapter.scrape({ format: "text" });
    const html = await adapter.scrape({ format: "html" });

    const book: Partial<Book> = {};

    // Extract title
    const titleMatch = content.content.match(/^([^\n]+)/);
    if (titleMatch) {
      book.title = titleMatch[1].trim();
    }

    // Extract price
    const priceMatch = content.content.match(/£(\d+\.?\d*)/);
    if (priceMatch) {
      book.price = parseFloat(priceMatch[1]);
    }

    // Extract availability
    if (content.content.toLowerCase().includes("in stock")) {
      book.availability = "In Stock";
    } else if (content.content.toLowerCase().includes("out of stock")) {
      book.availability = "Out of Stock";
    }

    // Extract rating (look for star rating)
    const ratingPatterns = [
      /(\d)\s*star/i,
      /rating[:\s]*(\d)/i,
      /One|Two|Three|Four|Five/i,
    ];

    for (const pattern of ratingPatterns) {
      const match = content.content.match(pattern);
      if (match) {
        if (match[1]) {
          book.rating = parseInt(match[1], 10);
        } else {
          // Convert word to number
          const wordToNum: Record<string, number> = {
            one: 1, two: 2, three: 3, four: 4, five: 5,
          };
          const word = match[0].toLowerCase();
          if (wordToNum[word]) {
            book.rating = wordToNum[word];
          }
        }
        break;
      }
    }

    // Extract description
    const descMatch = html.html?.match(/<p[^>]*>([^<]{50,})<\/p>/);
    if (descMatch) {
      book.description = descMatch[1].trim();
    }

    return book;
  }

  /**
   * Validate extracted book data
   */
  private validateBook(book: Partial<Book>): { valid: boolean; fieldsFilled: number; totalFields: number } {
    const requiredFields = ["title"];
    const optionalFields = ["author", "price", "rating", "availability", "description"];
    const totalFields = requiredFields.length + optionalFields.length;

    let fieldsFilled = 0;
    let valid = true;

    // Check required fields
    for (const field of requiredFields) {
      if (book[field as keyof Book]) {
        fieldsFilled++;
      } else {
        valid = false;
      }
    }

    // Check optional fields
    for (const field of optionalFields) {
      if (book[field as keyof Book] !== undefined && book[field as keyof Book] !== null) {
        fieldsFilled++;
      }
    }

    return { valid, fieldsFilled, totalFields };
  }

  /**
   * Calculate accuracy of extracted book data
   */
  private calculateBookAccuracy(book: Partial<Book>): number {
    // Expected data for "A Light in the Attic"
    const expected = {
      title: "A Light in the Attic",
      price: 51.77,
      availability: "In Stock",
      rating: 3,
    };

    let correctFields = 0;
    let totalChecked = 0;

    if (book.title) {
      totalChecked++;
      if (book.title.toLowerCase().includes("light") && book.title.toLowerCase().includes("attic")) {
        correctFields++;
      }
    }

    if (book.price !== undefined) {
      totalChecked++;
      // Allow 10% variance
      if (Math.abs(book.price - expected.price) < expected.price * 0.1) {
        correctFields++;
      }
    }

    if (book.availability) {
      totalChecked++;
      if (book.availability.toLowerCase().includes("in stock")) {
        correctFields++;
      }
    }

    if (book.rating !== undefined) {
      totalChecked++;
      if (book.rating === expected.rating) {
        correctFields++;
      }
    }

    return totalChecked > 0 ? (correctFields / totalChecked) * 100 : 0;
  }
}

/**
 * Hacker News structured extraction scenario
 */
export class HNStructuredScenario extends BaseScenario {
  id = "structured-hn";
  name = "HN Structured Extraction";
  description = "Extract structured data from Hacker News";
  requiredCapabilities: AdapterCapability[] = ["navigation", "scraping"];

  private testUrl = "https://news.ycombinator.com/";

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const HNStorySchema = z.object({
      stories: z.array(
        z.object({
          title: z.string(),
          url: z.string().optional(),
          points: z.number().optional(),
          author: z.string().optional(),
          comments: z.number().optional(),
        })
      ),
    });

    try {
      const { result, duration } = await measureTime(async () => {
        await adapter.navigate(this.testUrl);
        await adapter.waitFor({ type: "load" });

        // Try structured extraction first
        if (adapter.supports("structuredExtraction")) {
          try {
            return await adapter.extractStructured(HNStorySchema, "Extract the top 5 stories from Hacker News");
          } catch {
            // Fall back to item extraction
          }
        }

        // Use item extraction
        const items = await adapter.extractItems(".athing", {
          title: ".titleline a",
          url: ".titleline a",
        });

        return { stories: items.slice(0, 5) };
      });

      const storiesExtracted = result.stories?.length || 0;
      const quality = calculateStructuredQuality(
        storiesExtracted > 0,
        storiesExtracted,
        5,
        storiesExtracted >= 5 ? 100 : (storiesExtracted / 5) * 100
      );

      return createBenchmarkResult(adapter.name, this.id, true, duration, {
        data: result,
        quality,
      });
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function createStructuredDataScenario(config?: ScenarioConfig): StructuredDataScenario {
  return new StructuredDataScenario(config);
}

export default StructuredDataScenario;
