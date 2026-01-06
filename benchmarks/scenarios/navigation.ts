/**
 * Browser Automation Benchmark - Navigation & Interaction Scenario
 *
 * Task: Navigate to a website, click through 3 pages, capture final state
 */

import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig } from "./types.js";
import {
  measureTime,
  calculateNavigationQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";

/**
 * Navigation test site configuration
 */
interface NavigationPath {
  url: string;
  clickSelector?: string;
  waitFor?: string;
  description: string;
}

/**
 * Navigation & Interaction Benchmark Scenario
 */
export class NavigationScenario extends BaseScenario {
  id = "navigation";
  name = "Navigation & Interaction";
  description = "Navigate to a website, click through 3 pages, capture final state";
  requiredCapabilities: AdapterCapability[] = ["navigation", "interaction"];

  // Using a reliable, static test site
  private navigationPath: NavigationPath[] = [
    {
      url: "https://example.com/",
      description: "Start at example.com",
    },
    {
      url: "https://www.iana.org/domains/example",
      clickSelector: "a[href*='iana.org']",
      description: "Click link to IANA",
    },
    {
      url: "https://www.iana.org/",
      clickSelector: "a[href='/']",
      waitFor: "h1",
      description: "Navigate to IANA home",
    },
  ];

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const visitedUrls: string[] = [];

    try {
      const { result: finalState, duration } = await measureTime(async () => {
        // Step 1: Navigate to starting URL
        const startResult = await adapter.navigate(this.navigationPath[0].url);
        visitedUrls.push(startResult.url);

        // Step 2: Click through pages
        for (let i = 1; i < this.navigationPath.length; i++) {
          const step = this.navigationPath[i];

          if (step.clickSelector) {
            try {
              await adapter.click(step.clickSelector);

              // Wait for navigation to complete
              await adapter.waitFor({ type: "networkIdle" });

              const currentUrl = await adapter.getCurrentUrl();
              visitedUrls.push(currentUrl);
            } catch (clickError) {
              // If click fails, try direct navigation
              const navResult = await adapter.navigate(step.url);
              visitedUrls.push(navResult.url);
            }
          } else {
            const navResult = await adapter.navigate(step.url);
            visitedUrls.push(navResult.url);
          }

          // Wait if specified
          if (step.waitFor) {
            await adapter.waitFor({ type: "selector", selector: step.waitFor });
          }
        }

        // Step 3: Capture final state
        const finalUrl = await adapter.getCurrentUrl();
        const finalTitle = await adapter.getTitle();

        let screenshot;
        if (adapter.supports("screenshots")) {
          screenshot = await adapter.screenshot();
        }

        return {
          finalUrl,
          finalTitle,
          visitedUrls,
          screenshot: screenshot?.path,
        };
      });

      // Calculate quality metrics
      const expectedUrls = this.navigationPath.map((p) => p.url);
      const expectedFinalUrl = this.navigationPath[this.navigationPath.length - 1].url;

      const quality = calculateNavigationQuality(
        visitedUrls,
        expectedUrls,
        finalState.finalUrl,
        expectedFinalUrl
      );

      return createBenchmarkResult(adapter.name, this.id, true, duration, {
        data: finalState,
        quality,
      });
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
        data: { visitedUrls },
      });
    }
  }
}

/**
 * Alternative navigation scenario using Wikipedia
 */
export class WikipediaNavigationScenario extends BaseScenario {
  id = "navigation-wikipedia";
  name = "Wikipedia Navigation";
  description = "Navigate through Wikipedia articles following links";
  requiredCapabilities: AdapterCapability[] = ["navigation", "interaction"];

  private path = [
    { url: "https://en.wikipedia.org/wiki/Web_browser", linkText: "Internet" },
    { url: "https://en.wikipedia.org/wiki/Internet", linkText: "World Wide Web" },
    { url: "https://en.wikipedia.org/wiki/World_Wide_Web", linkText: null },
  ];

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    const visitedUrls: string[] = [];

    try {
      const { result, duration } = await measureTime(async () => {
        // Start at first page
        await adapter.navigate(this.path[0].url);
        visitedUrls.push(await adapter.getCurrentUrl());

        // Follow links
        for (let i = 0; i < this.path.length - 1; i++) {
          const linkText = this.path[i].linkText;
          if (linkText) {
            // Click on link containing the text
            try {
              await adapter.click(`a:has-text("${linkText}")`);
              await adapter.waitFor({ type: "networkIdle" });
            } catch {
              // Fallback to direct navigation
              await adapter.navigate(this.path[i + 1].url);
            }
            visitedUrls.push(await adapter.getCurrentUrl());
          }
        }

        return {
          finalUrl: await adapter.getCurrentUrl(),
          finalTitle: await adapter.getTitle(),
          visitedUrls,
        };
      });

      const expectedFinal = this.path[this.path.length - 1].url;
      const quality = calculateNavigationQuality(
        visitedUrls,
        this.path.map((p) => p.url),
        result.finalUrl,
        expectedFinal
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

export function createNavigationScenario(config?: ScenarioConfig): NavigationScenario {
  return new NavigationScenario(config);
}

export default NavigationScenario;
