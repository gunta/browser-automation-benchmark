/**
 * Browser Automation Benchmark - Web Search Scenario
 *
 * Task: Search for "weather Tokyo tomorrow" and extract the answer
 */

import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
  SearchResult,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig } from "./types.js";
import {
  measureTime,
  calculateSearchQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";

/**
 * Web Search Benchmark Scenario
 */
export class SearchScenario extends BaseScenario {
  id = "search";
  name = "Web Search";
  description = "Search for weather information and extract the answer";
  requiredCapabilities: AdapterCapability[] = ["navigation", "scraping"];

  private searchQuery = "weather Tokyo tomorrow";
  private searchEngineUrl = "https://www.google.com/";

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    try {
      // Check if adapter has native search capability
      if ("search" in adapter && typeof (adapter as any).search === "function") {
        return this.runWithNativeSearch(adapter);
      }

      // Otherwise, use browser navigation
      return this.runWithBrowserSearch(adapter);
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Run search using adapter's native search capability (e.g., Firecrawl)
   */
  private async runWithNativeSearch(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const { result, duration } = await measureTime(async () => {
      const searchResult = await (adapter as any).search(this.searchQuery);
      return searchResult as SearchResult;
    });

    const foundAnswer = !!result.answer || result.results.length > 0;
    const answerAccuracy = this.evaluateSearchAnswer(result.answer || result.results[0]?.snippet);

    const quality = calculateSearchQuality(foundAnswer, answerAccuracy, result.results.length);

    return createBenchmarkResult(adapter.name, this.id, true, duration, {
      data: {
        query: result.query,
        answer: result.answer,
        resultCount: result.results.length,
        topResults: result.results.slice(0, 3),
      },
      quality,
    });
  }

  /**
   * Run search using browser navigation to search engine
   */
  private async runWithBrowserSearch(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const { result, duration } = await measureTime(async () => {
      // Navigate to search engine
      await adapter.navigate(this.searchEngineUrl);
      await adapter.waitFor({ type: "load" });

      // Find and fill search box
      const searchSelectors = [
        'input[name="q"]',
        'input[type="search"]',
        'textarea[name="q"]',
        "#search",
        ".search-input",
      ];

      let searchFilled = false;
      for (const selector of searchSelectors) {
        try {
          await adapter.type(selector, this.searchQuery);
          searchFilled = true;
          break;
        } catch {
          // Try next selector
        }
      }

      if (!searchFilled) {
        throw new Error("Could not find search input");
      }

      // Submit search
      await adapter.pressKey("Enter");
      await adapter.waitFor({ type: "networkIdle" });

      // Wait for results to load
      await adapter.waitFor({ type: "timeout", ms: 2000 });

      // Extract results
      const pageContent = await adapter.scrape({ format: "text" });

      // Parse search results from content
      const answer = this.extractAnswerFromContent(pageContent.content);
      const results = this.extractResultsFromContent(pageContent.content);

      return {
        query: this.searchQuery,
        answer,
        results,
        rawContent: pageContent.content.substring(0, 1000),
      };
    });

    const foundAnswer = !!result.answer;
    const answerAccuracy = this.evaluateSearchAnswer(result.answer);

    const quality = calculateSearchQuality(foundAnswer, answerAccuracy, result.results.length);

    return createBenchmarkResult(adapter.name, this.id, true, duration, {
      data: result,
      quality,
    });
  }

  /**
   * Extract weather answer from page content
   */
  private extractAnswerFromContent(content: string): string | undefined {
    // Look for temperature patterns
    const tempPatterns = [
      /(\d+)\s*°[CF]/gi,
      /temperature[:\s]+(\d+)/gi,
      /high[:\s]+(\d+)/gi,
      /(\d+)\s*degrees/gi,
    ];

    for (const pattern of tempPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    // Look for weather condition words
    const conditions = ["sunny", "cloudy", "rainy", "clear", "partly", "overcast"];
    const lowerContent = content.toLowerCase();

    for (const condition of conditions) {
      if (lowerContent.includes(condition)) {
        // Extract surrounding context
        const index = lowerContent.indexOf(condition);
        const start = Math.max(0, index - 20);
        const end = Math.min(content.length, index + condition.length + 20);
        return content.substring(start, end).trim();
      }
    }

    return undefined;
  }

  /**
   * Extract search results from page content
   */
  private extractResultsFromContent(content: string): Array<{ title: string; url: string; snippet: string }> {
    const results: Array<{ title: string; url: string; snippet: string }> = [];

    // Simple heuristic: look for URLs and surrounding text
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlPattern) || [];

    for (const url of urls.slice(0, 5)) {
      results.push({
        title: "Search Result",
        url,
        snippet: "",
      });
    }

    return results;
  }

  /**
   * Evaluate the accuracy of a search answer
   */
  private evaluateSearchAnswer(answer?: string): number {
    if (!answer) return 0;

    // Check for weather-related content
    const weatherIndicators = [
      /\d+\s*°/i, // Temperature with degree symbol
      /\d+\s*degrees/i, // Temperature in words
      /sunny|cloudy|rainy|clear|overcast/i, // Weather conditions
      /weather|forecast/i, // Weather keywords
      /tokyo/i, // Location mentioned
    ];

    let score = 0;
    for (const indicator of weatherIndicators) {
      if (indicator.test(answer)) {
        score += 20;
      }
    }

    return Math.min(score, 100);
  }
}

/**
 * Alternative search scenario using DuckDuckGo (more automation-friendly)
 */
export class DuckDuckGoSearchScenario extends BaseScenario {
  id = "search-ddg";
  name = "DuckDuckGo Search";
  description = "Search DuckDuckGo and extract results";
  requiredCapabilities: AdapterCapability[] = ["navigation", "scraping"];

  private searchQuery = "current time in Tokyo";

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    try {
      const { result, duration } = await measureTime(async () => {
        // Use DuckDuckGo HTML version (more reliable)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(this.searchQuery)}`;
        await adapter.navigate(searchUrl);
        await adapter.waitFor({ type: "load" });

        // Extract results
        const content = await adapter.scrape({ format: "text" });

        // Look for time in the content
        const timeMatch = content.content.match(/\d{1,2}:\d{2}\s*(AM|PM)?/i);

        return {
          query: this.searchQuery,
          answer: timeMatch ? timeMatch[0] : undefined,
          rawContent: content.content.substring(0, 500),
        };
      });

      const foundAnswer = !!result.answer;
      const quality = calculateSearchQuality(foundAnswer, foundAnswer ? 80 : 0, 1);

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

export function createSearchScenario(config?: ScenarioConfig): SearchScenario {
  return new SearchScenario(config);
}

export default SearchScenario;
