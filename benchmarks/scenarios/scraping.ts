/**
 * Browser Automation Benchmark - Web Scraping Scenario
 *
 * Task: Extract the top 5 Hacker News stories with title, points, author, and URL
 */

import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
  ScrapedItem,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig, ExpectedResult } from "./types.js";
import {
  measureTime,
  calculateScrapingQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";
import { measureUsage } from "../utils/ccusage.js";

/**
 * Expected Hacker News story structure
 */
interface HNStory {
  title: string;
  url?: string;
  points?: number;
  author?: string;
  comments?: number;
}

/**
 * Web Scraping Benchmark Scenario
 */
export class ScrapingScenario extends BaseScenario {
  id = "scraping";
  name = "Web Scraping";
  description = "Extract top 5 Hacker News stories with title, points, author, and URL";
  requiredCapabilities: AdapterCapability[] = ["navigation", "scraping"];

  private targetUrl = "https://news.ycombinator.com/";
  private itemCount = 5;

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const timeout = this.config.timeout || 60000;

    try {
      // Measure both time and token usage
      const { result: stories, duration } = await measureTime(async () => {
        // Navigate to Hacker News
        await adapter.navigate(this.targetUrl);

        // Try to extract items using the adapter
        try {
          const items = await adapter.extractItems(".athing", {
            title: ".titleline a",
            url: ".titleline a",
            points: ".score",
            author: ".hnuser",
          });

          return items.slice(0, this.itemCount);
        } catch {
          // Fallback: Use scrape method and parse manually
          const data = await adapter.scrape({ selector: "body", format: "text" });

          // Basic parsing (adapter-specific parsing would be better)
          return this.parseHNFromText(data.content);
        }
      });

      // Calculate quality metrics
      const quality = calculateScrapingQuality(
        stories as ScrapedItem[],
        this.getExpectedStories(),
        ["title"]
      );

      // Check for token usage via ccusage
      const tokenUsage = await this.getTokenUsage();

      return createBenchmarkResult(adapter.name, this.id, true, duration, {
        tokensUsed: tokenUsage?.totalTokens,
        inputTokens: tokenUsage?.inputTokens,
        outputTokens: tokenUsage?.outputTokens,
        data: stories,
        quality,
      });
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Parse HN stories from plain text (fallback method)
   */
  private parseHNFromText(text: string): HNStory[] {
    const stories: HNStory[] = [];
    const lines = text.split("\n").filter((l) => l.trim());

    // Simple heuristic: look for numbered items
    let currentStory: Partial<HNStory> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for story titles (usually have a link text pattern)
      if (trimmed.match(/^\d+\.\s+/) || trimmed.match(/^[A-Z]/)) {
        if (currentStory.title) {
          stories.push(currentStory as HNStory);
          if (stories.length >= this.itemCount) break;
        }
        currentStory = { title: trimmed.replace(/^\d+\.\s+/, "") };
      }

      // Look for points
      const pointsMatch = trimmed.match(/(\d+)\s+points?/);
      if (pointsMatch && currentStory.title) {
        currentStory.points = parseInt(pointsMatch[1], 10);
      }

      // Look for author
      const authorMatch = trimmed.match(/by\s+(\w+)/);
      if (authorMatch && currentStory.title) {
        currentStory.author = authorMatch[1];
      }
    }

    // Add last story
    if (currentStory.title && stories.length < this.itemCount) {
      stories.push(currentStory as HNStory);
    }

    return stories.slice(0, this.itemCount);
  }

  /**
   * Get expected stories for quality comparison
   * In real benchmarks, this would be fetched fresh or use known test data
   */
  private getExpectedStories(): ScrapedItem[] {
    // Return empty array - we can't know exact stories ahead of time
    // Quality will be measured by format and completeness instead
    return [];
  }

  /**
   * Get token usage (placeholder - would integrate with ccusage)
   */
  private async getTokenUsage(): Promise<{ totalTokens: number; inputTokens: number; outputTokens: number } | null> {
    // This would be populated by ccusage integration in a real benchmark
    return null;
  }
}

/**
 * Create a scraping scenario with custom configuration
 */
export function createScrapingScenario(config?: ScenarioConfig): ScrapingScenario {
  return new ScrapingScenario(config);
}

export default ScrapingScenario;
