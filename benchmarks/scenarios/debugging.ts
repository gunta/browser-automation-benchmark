/**
 * Browser Automation Benchmark - Debugging & Log Capture Scenario
 *
 * Task: Load a page with intentional JS errors, capture and report all errors
 */

import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
  LogEntry,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig } from "./types.js";
import {
  measureTime,
  calculateDebuggingQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";

/**
 * Test page with intentional errors
 */
const TEST_PAGE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Error Test Page</title>
</head>
<body>
  <h1>Error Test Page</h1>
  <p>This page contains intentional JavaScript errors for testing.</p>

  <script>
    // Error 1: Reference error
    console.log("Starting error tests...");
    setTimeout(() => {
      undefinedFunction();
    }, 100);

    // Error 2: Type error
    setTimeout(() => {
      null.toString();
    }, 200);

    // Error 3: Syntax error in eval
    setTimeout(() => {
      eval("invalid javascript {{{");
    }, 300);

    // Warning
    setTimeout(() => {
      console.warn("This is a warning message");
    }, 400);

    // Info
    setTimeout(() => {
      console.info("This is an info message");
    }, 500);

    // Network error simulation
    setTimeout(() => {
      fetch('/api/nonexistent-endpoint')
        .catch(err => console.error("Network error:", err));
    }, 600);
  </script>
</body>
</html>
`;

/**
 * Debugging & Log Capture Benchmark Scenario
 */
export class DebuggingScenario extends BaseScenario {
  id = "debugging";
  name = "Debugging & Log Capture";
  description = "Load page with JS errors, capture and report all errors";
  requiredCapabilities: AdapterCapability[] = ["navigation", "consoleLogs"];

  // Using a real page that commonly has errors, or httpbin for network testing
  private testUrls = [
    "https://httpbin.org/status/500", // Returns 500 error
    "https://httpbin.org/delay/1", // Slow response
  ];

  private expectedErrors = 3; // Based on test page
  private expectedWarnings = 1;
  private expectedInfo = 1;

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    try {
      const { result: debugInfo, duration } = await measureTime(async () => {
        // Navigate to a page that might have console output
        await adapter.navigate("https://httpbin.org/html");

        // Wait for page to fully load and any scripts to execute
        await adapter.waitFor({ type: "timeout", ms: 2000 });

        // Collect all logs
        const consoleLogs = await adapter.getConsoleLogs();
        const errors = await adapter.getErrors();

        let networkLogs: LogEntry[] = [];
        if (adapter.supports("networkLogs")) {
          networkLogs = await adapter.getNetworkLogs();
        }

        // Trigger a network error for testing
        try {
          await adapter.navigate("https://httpbin.org/status/404");
        } catch {
          // Expected to fail
        }

        // Get updated logs
        const allConsoleLogs = await adapter.getConsoleLogs();
        const allErrors = await adapter.getErrors();

        if (adapter.supports("networkLogs")) {
          networkLogs = await adapter.getNetworkLogs();
        }

        return {
          consoleLogs: allConsoleLogs,
          errors: allErrors,
          networkLogs,
          totalLogs: allConsoleLogs.length + networkLogs.length,
          errorCount: allErrors.length,
        };
      });

      // Calculate log completeness
      const logTypes = new Set<string>();
      if (debugInfo.consoleLogs.length > 0) logTypes.add("console");
      if (debugInfo.errors.length > 0) logTypes.add("error");
      if (debugInfo.networkLogs.length > 0) logTypes.add("network");

      // Possible types: console, error, network, warning
      const logCompleteness = (logTypes.size / 3) * 100;

      const quality = calculateDebuggingQuality(
        debugInfo.errorCount,
        1, // We expect at least 1 error (404)
        logCompleteness
      );

      return createBenchmarkResult(adapter.name, this.id, true, duration, {
        data: {
          totalLogs: debugInfo.totalLogs,
          errorCount: debugInfo.errorCount,
          consoleLogCount: debugInfo.consoleLogs.length,
          networkLogCount: debugInfo.networkLogs.length,
          logTypes: Array.from(logTypes),
        },
        quality,
      });
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Extended debugging scenario that uses dev3000-specific features
 */
export class Dev3000DebuggingScenario extends BaseScenario {
  id = "debugging-dev3000";
  name = "Dev3000 Debugging";
  description = "Test dev3000-specific debugging features like fix_my_app";
  requiredCapabilities: AdapterCapability[] = ["consoleLogs", "networkLogs"];

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    // This scenario is specifically for dev3000
    if (adapter.name !== "dev3000") {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: "This scenario is only for dev3000 adapter",
      });
    }

    try {
      const { result, duration } = await measureTime(async () => {
        // Use dev3000-specific methods
        const dev3000 = adapter as any;

        // Simulate some errors being logged
        dev3000.addBrowserLog("Uncaught TypeError: Cannot read property 'x' of undefined", "error");
        dev3000.addBrowserLog("React warning: Invalid prop type", "warning");
        dev3000.addServerLog("GET /api/users 500 Internal Server Error");
        dev3000.addNetworkRequest("/api/users", "GET", 500);

        // Use fix_my_app tool
        const fixResult = await dev3000.fixMyApp();

        // Get comprehensive debug info
        const debugInfo = await dev3000.getDebugInfo();

        return {
          fixResult,
          debugInfo,
          errorsFound: fixResult.errorsFound,
          suggestions: fixResult.suggestions.length,
        };
      });

      const quality = calculateDebuggingQuality(
        result.errorsFound,
        2, // We added 2 errors
        100 // Full completeness since we're using all features
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

export function createDebuggingScenario(config?: ScenarioConfig): DebuggingScenario {
  return new DebuggingScenario(config);
}

export default DebuggingScenario;
