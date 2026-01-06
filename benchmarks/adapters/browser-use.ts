/**
 * Browser-Use Adapter
 *
 * Adapter for browser-use - Python-based AI browser automation agent.
 * Since browser-use is Python, this adapter uses child_process to invoke Python scripts.
 */

import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
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

interface BrowserUseResult {
  success: boolean;
  url?: string;
  title?: string;
  content?: string;
  html?: string;
  screenshot?: string;
  error?: string;
  logs?: Array<{ type: string; message: string }>;
  data?: unknown;
}

export class BrowserUseAdapter extends BaseAdapter {
  readonly name = "browser-use";
  readonly description = "Python AI browser agent - LLM-driven automation with multi-provider support";

  private pythonPath = "python3";
  private tempDir: string = "";
  private currentUrl = "";
  private apiKey: string = "";

  supports(capability: AdapterCapability): boolean {
    const supported: AdapterCapability[] = [
      "navigation",
      "scraping",
      "interaction",
      "forms",
      "screenshots",
      "consoleLogs",
      "search",
      "structuredExtraction",
      "aiTasks",
    ];
    return supported.includes(capability);
  }

  async setup(config?: AdapterConfig): Promise<void> {
    this.config = config || {};
    this.apiKey = this.config.apiKey || process.env.BROWSER_USE_API_KEY || "";

    // Create temp directory for Python scripts and outputs
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "browser-use-benchmark-"));

    // Check if Python and browser-use are available
    try {
      execSync(`${this.pythonPath} -c "import browser_use"`, { stdio: "ignore" });
    } catch {
      throw new Error(
        "browser-use Python package not found. Install with: pip install browser-use"
      );
    }
  }

  async cleanup(): Promise<void> {
    // Clean up temp directory
    if (this.tempDir && fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
    this.logs = [];
    this.networkLogs = [];
  }

  private async runPythonScript(script: string): Promise<BrowserUseResult> {
    const scriptPath = path.join(this.tempDir, `script_${Date.now()}.py`);
    const outputPath = path.join(this.tempDir, `output_${Date.now()}.json`);

    // Wrap script with output handling
    const wrappedScript = `
import json
import asyncio
from browser_use import Agent, Browser
${this.apiKey ? `from browser_use import ChatBrowserUse` : `from browser_use import ChatOpenAI`}

async def main():
    result = {"success": False}
    try:
        browser = Browser(headless=${this.config.headless ? "True" : "False"})
        ${this.apiKey ? `llm = ChatBrowserUse()` : `llm = ChatOpenAI(model="gpt-4o-mini")`}

        ${script}

        result["success"] = True
    except Exception as e:
        result["error"] = str(e)
        result["success"] = False

    with open("${outputPath.replace(/\\/g, "\\\\")}", "w") as f:
        json.dump(result, f)

if __name__ == "__main__":
    asyncio.run(main())
`;

    fs.writeFileSync(scriptPath, wrappedScript);

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pythonPath, [scriptPath], {
        env: {
          ...process.env,
          BROWSER_USE_API_KEY: this.apiKey,
        },
        cwd: this.tempDir,
      });

      let stderr = "";

      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (fs.existsSync(outputPath)) {
          try {
            const result = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
            resolve(result);
          } catch {
            reject(new Error(`Failed to parse output: ${stderr}`));
          }
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }

        // Cleanup
        if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        proc.kill();
        reject(new Error("Python script timed out"));
      }, 120000);
    });
  }

  async navigate(url: string): Promise<NavigationResult> {
    const startTime = Date.now();

    const script = `
agent = Agent(
    task=f"Navigate to {url} and report the page title",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=5)
result["url"] = "${url}"
result["title"] = history.final_result() or ""
await browser.close()
`.replace("{url}", url);

    const pythonResult = await this.runPythonScript(script);
    this.currentUrl = url;

    return {
      url: pythonResult.url || url,
      title: pythonResult.title || "",
      loadTime: Date.now() - startTime,
    };
  }

  async click(selector: string): Promise<void> {
    const script = `
agent = Agent(
    task=f"Click on the element matching selector: ${selector}",
    llm=llm,
    browser=browser,
)
await agent.run(max_steps=3)
await browser.close()
`;

    await this.runPythonScript(script);
  }

  async type(selector: string, text: string): Promise<void> {
    const script = `
agent = Agent(
    task=f"Type '${text}' into the element matching selector: ${selector}",
    llm=llm,
    browser=browser,
)
await agent.run(max_steps=3)
await browser.close()
`;

    await this.runPythonScript(script);
  }

  async scrape(options?: { selector?: string; format?: "text" | "html" | "markdown" }): Promise<ScrapedData> {
    const selector = options?.selector || "body";
    const format = options?.format || "text";

    const script = `
agent = Agent(
    task=f"Navigate to ${this.currentUrl}, extract the ${format} content from '${selector}' and return it",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=10)
result["content"] = history.final_result() or ""
result["url"] = "${this.currentUrl}"
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);

    return {
      url: this.currentUrl,
      title: pythonResult.title || "",
      content: pythonResult.content || "",
      extractedAt: new Date(),
    };
  }

  async extractItems(selector: string, fields: Record<string, string>): Promise<ScrapedItem[]> {
    const fieldDescriptions = Object.entries(fields)
      .map(([name, sel]) => `${name} (from ${sel})`)
      .join(", ");

    const script = `
agent = Agent(
    task=f"Navigate to ${this.currentUrl}, extract items from '${selector}'. For each item, get: ${fieldDescriptions}. Return as JSON array.",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=15)
import json
try:
    result["data"] = json.loads(history.final_result() or "[]")
except:
    result["data"] = []
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);

    if (Array.isArray(pythonResult.data)) {
      return pythonResult.data as ScrapedItem[];
    }

    return [];
  }

  async extractStructured<T>(schema: z.ZodSchema<T>, prompt?: string): Promise<T> {
    // browser-use has native structured output support
    const schemaDescription = JSON.stringify(this.zodToJsonSchema(schema));

    const script = `
agent = Agent(
    task=f"${prompt || "Extract data from the page"} following this JSON schema: ${schemaDescription}",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=15)
import json
try:
    result["data"] = json.loads(history.final_result() or "{}")
except:
    result["data"] = {}
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);

    return schema.parse(pythonResult.data);
  }

  async screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Screenshot> {
    const outputPath = options?.path || path.join(this.tempDir, `screenshot_${Date.now()}.png`);

    const script = `
agent = Agent(
    task=f"Navigate to ${this.currentUrl} and take a screenshot",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=5)
screenshots = history.screenshots()
if screenshots:
    import base64
    result["screenshot"] = screenshots[-1]
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);

    if (pythonResult.screenshot) {
      const buffer = Buffer.from(pythonResult.screenshot, "base64");
      fs.writeFileSync(outputPath, buffer);
    }

    return {
      path: outputPath,
      width: 1280,
      height: 720,
      format: "png",
      capturedAt: new Date(),
      base64: pythonResult.screenshot,
    };
  }

  async getCurrentUrl(): Promise<string> {
    return this.currentUrl;
  }

  async getTitle(): Promise<string> {
    const script = `
agent = Agent(
    task=f"What is the title of the page at ${this.currentUrl}?",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=3)
result["title"] = history.final_result() or ""
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);
    return pythonResult.title || "";
  }

  /**
   * Execute an open-ended AI task - browser-use's key feature
   */
  async executeTask(task: string): Promise<unknown> {
    const script = `
agent = Agent(
    task="${task.replace(/"/g, '\\"')}",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=50)
result["data"] = history.final_result()
result["urls"] = history.urls()
result["actions"] = history.action_names()
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);
    return pythonResult.data;
  }

  async search(query: string): Promise<SearchResult> {
    const script = `
agent = Agent(
    task=f"Search Google for '${query}' and extract the answer or top results",
    llm=llm,
    browser=browser,
)
history = await agent.run(max_steps=20)
result["data"] = history.final_result()
await browser.close()
`;

    const pythonResult = await this.runPythonScript(script);

    return {
      query,
      answer: typeof pythonResult.data === "string" ? pythonResult.data : undefined,
      results: [],
    };
  }

  /**
   * Convert Zod schema to JSON Schema (simplified)
   */
  private zodToJsonSchema(schema: z.ZodSchema): unknown {
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

      return { type: "object", properties, required };
    }

    if (zodType.typeName === "ZodString") return { type: "string" };
    if (zodType.typeName === "ZodNumber") return { type: "number" };
    if (zodType.typeName === "ZodBoolean") return { type: "boolean" };
    if (zodType.typeName === "ZodArray") {
      return { type: "array", items: this.zodToJsonSchema(zodType.type) };
    }

    return { type: "string" };
  }
}

export default BrowserUseAdapter;
