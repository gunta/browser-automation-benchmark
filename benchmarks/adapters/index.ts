/**
 * Browser Automation Benchmark - Adapter Index
 *
 * Exports all available adapters for benchmark usage.
 */

export * from "./types.js";

export { PlaywrightMCPAdapter } from "./playwright-mcp.js";
export { PlaywriterAdapter } from "./playwriter.js";
export { FirecrawlAdapter } from "./firecrawl.js";
export { BrowserUseAdapter } from "./browser-use.js";
export { Dev3000Adapter } from "./dev3000.js";

import { BrowserAutomationAdapter } from "./types.js";
import { PlaywrightMCPAdapter } from "./playwright-mcp.js";
import { PlaywriterAdapter } from "./playwriter.js";
import { FirecrawlAdapter } from "./firecrawl.js";
import { BrowserUseAdapter } from "./browser-use.js";
import { Dev3000Adapter } from "./dev3000.js";

/**
 * All available adapters
 */
export const adapters = {
  "playwright-mcp": PlaywrightMCPAdapter,
  playwriter: PlaywriterAdapter,
  firecrawl: FirecrawlAdapter,
  "browser-use": BrowserUseAdapter,
  dev3000: Dev3000Adapter,
} as const;

export type AdapterName = keyof typeof adapters;

/**
 * Create an adapter by name
 */
export function createAdapter(name: AdapterName): BrowserAutomationAdapter {
  const AdapterClass = adapters[name];
  if (!AdapterClass) {
    throw new Error(`Unknown adapter: ${name}`);
  }
  return new AdapterClass();
}

/**
 * Get list of all adapter names
 */
export function getAdapterNames(): AdapterName[] {
  return Object.keys(adapters) as AdapterName[];
}

/**
 * Adapter metadata for documentation
 */
export const adapterMetadata: Record<
  AdapterName,
  {
    name: string;
    description: string;
    language: string;
    repository: string;
    strengths: string[];
    limitations: string[];
  }
> = {
  "playwright-mcp": {
    name: "Playwright MCP",
    description: "Microsoft's official MCP server using accessibility tree",
    language: "TypeScript",
    repository: "https://github.com/microsoft/playwright-mcp",
    strengths: [
      "Official Microsoft implementation",
      "Cross-browser support",
      "Deterministic element selection via accessibility tree",
      "Many specialized tools",
    ],
    limitations: [
      "More tools = more context window usage",
      "No cloud hosting option",
      "Less flexible than raw Playwright API",
    ],
  },
  playwriter: {
    name: "Playwriter",
    description: "Chrome extension + MCP with full Playwright API",
    language: "TypeScript",
    repository: "https://github.com/remorses/playwriter",
    strengths: [
      "90% less context window than alternatives",
      "Full Playwright API access",
      "Works with existing browser profile",
      "Can bypass automation detection",
    ],
    limitations: [
      "Requires Chrome extension",
      "No headless mode",
      "Single tool means less structured output",
    ],
  },
  firecrawl: {
    name: "Firecrawl",
    description: "Web scraping API for LLM-ready content",
    language: "TypeScript",
    repository: "https://github.com/firecrawl/firecrawl",
    strengths: [
      "Best-in-class web scraping",
      "LLM-ready output formats",
      "Handles anti-bot measures",
      "Excellent for RAG pipelines",
    ],
    limitations: [
      "Limited browser interaction",
      "Requires API key or self-hosting",
      "Not for stateful automation",
    ],
  },
  "browser-use": {
    name: "Browser Use",
    description: "Python AI browser agent with multi-provider LLM support",
    language: "Python",
    repository: "https://github.com/browser-use/browser-use",
    strengths: [
      "Native LLM integration",
      "Sophisticated DOM processing",
      "Production-ready with cloud option",
      "Handles complex, open-ended tasks",
    ],
    limitations: [
      "Python only",
      "Higher token usage",
      "Requires more setup",
    ],
  },
  dev3000: {
    name: "Dev3000",
    description: "Debugging assistant for web app development",
    language: "TypeScript",
    repository: "https://github.com/vercel-labs/dev3000",
    strengths: [
      "Automatic error detection",
      "Comprehensive log aggregation",
      "Timeline view for debugging",
      "Works with any web framework",
    ],
    limitations: [
      "Focused on debugging, not automation",
      "Requires running dev server",
      "Limited to development environment",
    ],
  },
};
