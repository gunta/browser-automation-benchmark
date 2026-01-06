/**
 * Browser Automation Benchmark - Scenarios Index
 */

export * from "./types.js";
export * from "./scraping.js";
export * from "./navigation.js";
export * from "./debugging.js";
export * from "./form-filling.js";
export * from "./search.js";
export * from "./structured-data.js";

import { BenchmarkScenario } from "./types.js";
import { ScrapingScenario } from "./scraping.js";
import { NavigationScenario, WikipediaNavigationScenario } from "./navigation.js";
import { DebuggingScenario, Dev3000DebuggingScenario } from "./debugging.js";
import { FormFillingScenario, LoginFormScenario } from "./form-filling.js";
import { SearchScenario, DuckDuckGoSearchScenario } from "./search.js";
import { StructuredDataScenario, HNStructuredScenario } from "./structured-data.js";

/**
 * All primary benchmark scenarios
 */
export const primaryScenarios: BenchmarkScenario[] = [
  new ScrapingScenario(),
  new NavigationScenario(),
  new DebuggingScenario(),
  new FormFillingScenario(),
  new SearchScenario(),
  new StructuredDataScenario(),
];

/**
 * Alternative/extended scenarios
 */
export const extendedScenarios: BenchmarkScenario[] = [
  new WikipediaNavigationScenario(),
  new Dev3000DebuggingScenario(),
  new LoginFormScenario(),
  new DuckDuckGoSearchScenario(),
  new HNStructuredScenario(),
];

/**
 * All available scenarios
 */
export const allScenarios: BenchmarkScenario[] = [...primaryScenarios, ...extendedScenarios];

/**
 * Get scenario by ID
 */
export function getScenarioById(id: string): BenchmarkScenario | undefined {
  return allScenarios.find((s) => s.id === id);
}

/**
 * Get scenarios by capability requirement
 */
export function getScenariosByCapability(capability: string): BenchmarkScenario[] {
  return allScenarios.filter((s) => s.requiredCapabilities.includes(capability as any));
}

/**
 * Scenario metadata for documentation
 */
export const scenarioMetadata = {
  scraping: {
    name: "Web Scraping",
    description: "Extract structured data from web pages",
    difficulty: "Easy",
    estimatedTime: "10-30s",
    primaryUrl: "https://news.ycombinator.com/",
  },
  navigation: {
    name: "Navigation & Interaction",
    description: "Navigate through pages and interact with elements",
    difficulty: "Medium",
    estimatedTime: "15-45s",
    primaryUrl: "https://example.com/",
  },
  debugging: {
    name: "Debugging & Log Capture",
    description: "Capture browser console logs and errors",
    difficulty: "Medium",
    estimatedTime: "10-20s",
    primaryUrl: "https://httpbin.org/html",
  },
  "form-filling": {
    name: "Form Filling",
    description: "Fill and submit web forms",
    difficulty: "Medium",
    estimatedTime: "15-30s",
    primaryUrl: "https://httpbin.org/forms/post",
  },
  search: {
    name: "Web Search",
    description: "Search the web and extract answers",
    difficulty: "Hard",
    estimatedTime: "20-60s",
    primaryUrl: "https://www.google.com/",
  },
  "structured-data": {
    name: "Structured Data Extraction",
    description: "Extract data conforming to a schema",
    difficulty: "Hard",
    estimatedTime: "15-45s",
    primaryUrl: "https://books.toscrape.com/",
  },
};
