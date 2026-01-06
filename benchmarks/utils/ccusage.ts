/**
 * Browser Automation Benchmark - ccusage Integration
 *
 * Integrates with ccusage (claude-code-usage) to track token consumption
 * during benchmark runs when using Claude Code.
 *
 * LLM Model: Claude Opus 4.5 (claude-opus-4-5) via Claude Code
 *
 * @see https://ccusage.com/guide/
 * @see https://platform.claude.com/docs/en/about-claude/models/overview
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Supported Claude models for benchmarking
 */
export const CLAUDE_MODELS = {
  /** Premium model - recommended for benchmarks */
  OPUS_4_5: "claude-opus-4-5",
  /** Smart model for complex agents and coding */
  SONNET_4_5: "claude-sonnet-4-5",
  /** Fastest model with near-frontier intelligence */
  HAIKU_4_5: "claude-haiku-4-5",
} as const;

/**
 * Default model for benchmarks - Claude Opus 4.5
 */
export const DEFAULT_BENCHMARK_MODEL = CLAUDE_MODELS.OPUS_4_5;

/**
 * Token usage data from ccusage
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCost: number;
  model?: string;
  timestamp: Date;
}

/**
 * Session data from ccusage
 */
export interface SessionUsage {
  sessionId: string;
  project: string;
  startTime: Date;
  endTime?: Date;
  usage: TokenUsage;
  steps: number;
}

/**
 * Daily usage summary
 */
export interface DailyUsage {
  date: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  sessions: number;
}

/**
 * Check if ccusage is installed and available
 */
export function isCcusageAvailable(): boolean {
  try {
    const result = spawnSync("bunx", ["ccusage", "--version"], {
      encoding: "utf-8",
      timeout: 5000,
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Get Claude Code data directories
 */
export function getClaudeDataDirs(): string[] {
  const home = os.homedir();
  const dirs: string[] = [];

  // New location (Claude Code v1.0.30+)
  const newDir = path.join(home, ".config", "claude", "projects");
  if (fs.existsSync(newDir)) {
    dirs.push(newDir);
  }

  // Legacy location
  const legacyDir = path.join(home, ".claude", "projects");
  if (fs.existsSync(legacyDir)) {
    dirs.push(legacyDir);
  }

  return dirs;
}

/**
 * Parse JSONL file and extract usage data
 */
export function parseUsageFile(filePath: string): TokenUsage[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const usages: TokenUsage[] = [];

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      // Extract token usage from various message formats
      if (data.usage || data.inputTokens || data.input_tokens) {
        const usage: TokenUsage = {
          inputTokens: data.usage?.inputTokens || data.inputTokens || data.input_tokens || 0,
          outputTokens: data.usage?.outputTokens || data.outputTokens || data.output_tokens || 0,
          totalTokens: 0,
          cacheReadTokens: data.usage?.cacheReadTokens || data.cacheReadTokens || 0,
          cacheWriteTokens: data.usage?.cacheWriteTokens || data.cacheWriteTokens || 0,
          estimatedCost: 0,
          model: data.model,
          timestamp: new Date(data.timestamp || data.createdAt || Date.now()),
        };

        usage.totalTokens = usage.inputTokens + usage.outputTokens;
        usage.estimatedCost = calculateCost(usage);

        usages.push(usage);
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return usages;
}

/**
 * Calculate estimated cost based on token usage
 *
 * Pricing (per 1M tokens, from Anthropic):
 * @see https://platform.claude.com/docs/en/about-claude/models/overview
 *
 * Claude 4.5 Models:
 * - Claude Opus 4.5: Input $5.00, Output $25.00
 * - Claude Sonnet 4.5: Input $3.00, Output $15.00
 * - Claude Haiku 4.5: Input $1.00, Output $5.00
 *
 * Other:
 * - ChatBrowserUse: Input $0.20, Output $2.00
 */
export function calculateCost(usage: TokenUsage): number {
  const model = usage.model?.toLowerCase() || "claude-opus-4-5";

  let inputRate: number;
  let outputRate: number;
  let cacheReadRate: number;
  let cacheWriteRate: number;

  if (model.includes("opus")) {
    // Claude Opus 4.5 pricing
    inputRate = 5.0 / 1_000_000;
    outputRate = 25.0 / 1_000_000;
    cacheReadRate = 0.5 / 1_000_000;
    cacheWriteRate = 6.25 / 1_000_000;
  } else if (model.includes("haiku")) {
    // Claude Haiku 4.5 pricing
    inputRate = 1.0 / 1_000_000;
    outputRate = 5.0 / 1_000_000;
    cacheReadRate = 0.1 / 1_000_000;
    cacheWriteRate = 1.25 / 1_000_000;
  } else if (model.includes("browseruse") || model.includes("browser-use")) {
    // ChatBrowserUse pricing
    inputRate = 0.2 / 1_000_000;
    outputRate = 2.0 / 1_000_000;
    cacheReadRate = 0.02 / 1_000_000;
    cacheWriteRate = 0.25 / 1_000_000;
  } else {
    // Default to Claude Sonnet 4.5 pricing
    inputRate = 3.0 / 1_000_000;
    outputRate = 15.0 / 1_000_000;
    cacheReadRate = 0.3 / 1_000_000;
    cacheWriteRate = 3.75 / 1_000_000;
  }

  return (
    usage.inputTokens * inputRate +
    usage.outputTokens * outputRate +
    usage.cacheReadTokens * cacheReadRate +
    usage.cacheWriteTokens * cacheWriteRate
  );
}

/**
 * Get current daily usage using ccusage CLI
 */
export async function getDailyUsage(date?: string): Promise<DailyUsage | null> {
  if (!isCcusageAvailable()) {
    console.warn("ccusage not available. Install with: bunx ccusage");
    return null;
  }

  try {
    const args = ["ccusage", "daily", "--json"];
    if (date) {
      args.push("--date", date);
    }

    const result = spawnSync("bunx", args, {
      encoding: "utf-8",
      timeout: 30000,
    });

    if (result.status !== 0) {
      console.error("ccusage error:", result.stderr);
      return null;
    }

    const data = JSON.parse(result.stdout);

    // Find today's usage or specified date
    const targetDate = date || new Date().toISOString().split("T")[0];
    const dayData = Array.isArray(data) ? data.find((d: any) => d.date === targetDate) : data;

    if (!dayData) {
      return null;
    }

    return {
      date: dayData.date,
      totalInputTokens: dayData.inputTokens || 0,
      totalOutputTokens: dayData.outputTokens || 0,
      totalCost: dayData.cost || 0,
      sessions: dayData.sessions || 0,
    };
  } catch (error) {
    console.error("Failed to get daily usage:", error);
    return null;
  }
}

/**
 * Get session usage using ccusage CLI
 */
export async function getSessionUsage(limit?: number): Promise<SessionUsage[]> {
  if (!isCcusageAvailable()) {
    return [];
  }

  try {
    const args = ["ccusage", "session", "--json"];
    if (limit) {
      args.push("--limit", String(limit));
    }

    const result = spawnSync("bunx", args, {
      encoding: "utf-8",
      timeout: 30000,
    });

    if (result.status !== 0) {
      return [];
    }

    const data = JSON.parse(result.stdout);

    return (Array.isArray(data) ? data : []).map((session: any) => ({
      sessionId: session.id || session.sessionId || "unknown",
      project: session.project || "unknown",
      startTime: new Date(session.startTime || session.start),
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      usage: {
        inputTokens: session.inputTokens || 0,
        outputTokens: session.outputTokens || 0,
        totalTokens: (session.inputTokens || 0) + (session.outputTokens || 0),
        cacheReadTokens: session.cacheReadTokens || 0,
        cacheWriteTokens: session.cacheWriteTokens || 0,
        estimatedCost: session.cost || 0,
        timestamp: new Date(session.startTime || session.start),
      },
      steps: session.steps || 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Snapshot of usage at a point in time
 */
export interface UsageSnapshot {
  timestamp: Date;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}

/**
 * Take a snapshot of current usage
 */
export async function takeUsageSnapshot(): Promise<UsageSnapshot> {
  const daily = await getDailyUsage();

  return {
    timestamp: new Date(),
    totalInputTokens: daily?.totalInputTokens || 0,
    totalOutputTokens: daily?.totalOutputTokens || 0,
    totalCost: daily?.totalCost || 0,
  };
}

/**
 * Calculate usage delta between two snapshots
 */
export function calculateUsageDelta(before: UsageSnapshot, after: UsageSnapshot): TokenUsage {
  const inputTokens = after.totalInputTokens - before.totalInputTokens;
  const outputTokens = after.totalOutputTokens - before.totalOutputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    estimatedCost: after.totalCost - before.totalCost,
    timestamp: after.timestamp,
  };
}

/**
 * Measure token usage for a function execution
 *
 * @example
 * const { result, usage } = await measureUsage(async () => {
 *   return await adapter.scrape("https://example.com");
 * });
 */
export async function measureUsage<T>(
  fn: () => Promise<T>
): Promise<{ result: T; usage: TokenUsage | null }> {
  const before = await takeUsageSnapshot();

  const result = await fn();

  // Small delay to ensure Claude Code has written the usage data
  await new Promise((resolve) => setTimeout(resolve, 500));

  const after = await takeUsageSnapshot();
  const usage = calculateUsageDelta(before, after);

  // If no change detected, usage tracking might not be available
  if (usage.totalTokens === 0) {
    return { result, usage: null };
  }

  return { result, usage };
}

/**
 * Format token usage for display
 */
export function formatUsage(usage: TokenUsage): string {
  const lines = [
    `Input Tokens:  ${usage.inputTokens.toLocaleString()}`,
    `Output Tokens: ${usage.outputTokens.toLocaleString()}`,
    `Total Tokens:  ${usage.totalTokens.toLocaleString()}`,
    `Est. Cost:     $${usage.estimatedCost.toFixed(4)}`,
  ];

  if (usage.cacheReadTokens > 0) {
    lines.push(`Cache Read:    ${usage.cacheReadTokens.toLocaleString()}`);
  }
  if (usage.cacheWriteTokens > 0) {
    lines.push(`Cache Write:   ${usage.cacheWriteTokens.toLocaleString()}`);
  }
  if (usage.model) {
    lines.push(`Model:         ${usage.model}`);
  }

  return lines.join("\n");
}

/**
 * Live monitoring of usage (runs ccusage live command)
 */
export function startLiveMonitoring(): void {
  if (!isCcusageAvailable()) {
    console.error("ccusage not available for live monitoring");
    return;
  }

  console.log("Starting live usage monitoring (Ctrl+C to stop)...");

  const proc = spawnSync("bunx", ["ccusage", "live"], {
    stdio: "inherit",
  });
}

export default {
  isCcusageAvailable,
  getClaudeDataDirs,
  parseUsageFile,
  calculateCost,
  getDailyUsage,
  getSessionUsage,
  takeUsageSnapshot,
  calculateUsageDelta,
  measureUsage,
  formatUsage,
  startLiveMonitoring,
};
