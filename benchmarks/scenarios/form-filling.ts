/**
 * Browser Automation Benchmark - Form Filling Scenario
 *
 * Task: Fill out a multi-field contact form with validation
 */

import {
  BrowserAutomationAdapter,
  BenchmarkResult,
  AdapterCapability,
  FormField,
} from "../adapters/types.js";
import { BaseScenario, ScenarioConfig } from "./types.js";
import {
  measureTime,
  calculateFormQuality,
  createBenchmarkResult,
} from "../utils/metrics.js";

/**
 * Test form data
 */
const TEST_FORM_DATA: FormField[] = [
  { selector: 'input[name="name"], #name, [placeholder*="name" i]', value: "John Doe", type: "text" },
  { selector: 'input[name="email"], #email, [type="email"]', value: "john.doe@example.com", type: "email" },
  { selector: 'input[name="phone"], #phone, [type="tel"]', value: "+1-555-123-4567", type: "text" },
  { selector: 'textarea[name="message"], #message, textarea', value: "This is a test message for the contact form.", type: "textarea" },
  { selector: 'select[name="subject"], #subject, select', value: "general", type: "select" },
];

/**
 * Form Filling Benchmark Scenario
 */
export class FormFillingScenario extends BaseScenario {
  id = "form-filling";
  name = "Form Filling";
  description = "Fill multi-field contact form with validation";
  requiredCapabilities: AdapterCapability[] = ["navigation", "interaction", "forms"];

  // Using httpbin for form testing (echoes back submitted data)
  private testUrl = "https://httpbin.org/forms/post";
  private formData = TEST_FORM_DATA;

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    let filledFields = 0;
    let validationsPassed = 0;
    const totalFields = this.formData.length;

    try {
      const { result, duration } = await measureTime(async () => {
        // Navigate to form page
        await adapter.navigate(this.testUrl);
        await adapter.waitFor({ type: "load" });

        // Fill form fields
        const results: Array<{ field: string; success: boolean; error?: string }> = [];

        for (const field of this.formData) {
          try {
            // Try multiple selectors
            const selectors = field.selector.split(", ");
            let filled = false;

            for (const selector of selectors) {
              try {
                if (field.type === "select") {
                  await adapter.selectOption(selector.trim(), field.value);
                } else {
                  await adapter.type(selector.trim(), field.value);
                }
                filled = true;
                filledFields++;
                results.push({ field: selector, success: true });
                break;
              } catch {
                // Try next selector
              }
            }

            if (!filled) {
              results.push({
                field: field.selector,
                success: false,
                error: "No matching element found",
              });
            }
          } catch (error) {
            results.push({
              field: field.selector,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Try to submit the form
        let submitSuccess = false;
        try {
          await adapter.click('button[type="submit"], input[type="submit"], button:has-text("Submit")');
          await adapter.waitFor({ type: "networkIdle" });
          submitSuccess = true;
          validationsPassed++;
        } catch {
          // Form submission failed
        }

        // Take screenshot of result
        let screenshot;
        if (adapter.supports("screenshots")) {
          screenshot = await adapter.screenshot();
        }

        // Get final page content to verify submission
        const finalContent = await adapter.scrape({ format: "text" });

        return {
          filledFields,
          totalFields,
          submitSuccess,
          results,
          screenshot: screenshot?.path,
          finalContent: finalContent.content.substring(0, 500),
        };
      });

      // Validations: 1 for form submission
      const totalValidations = 1;

      const quality = calculateFormQuality(
        filledFields,
        totalFields,
        validationsPassed,
        totalValidations
      );

      return createBenchmarkResult(adapter.name, this.id, true, duration, {
        data: result,
        quality,
      });
    } catch (error) {
      return createBenchmarkResult(adapter.name, this.id, false, 0, {
        error: error instanceof Error ? error.message : String(error),
        data: { filledFields, totalFields },
      });
    }
  }
}

/**
 * Login form scenario
 */
export class LoginFormScenario extends BaseScenario {
  id = "form-login";
  name = "Login Form";
  description = "Fill and submit a login form";
  requiredCapabilities: AdapterCapability[] = ["navigation", "interaction", "forms"];

  // Using a test login page
  private testUrl = "https://httpbin.org/forms/post";
  private credentials = {
    username: "testuser@example.com",
    password: "TestPassword123!",
  };

  constructor(config?: ScenarioConfig) {
    super(config);
  }

  async run(adapter: BrowserAutomationAdapter): Promise<BenchmarkResult> {
    try {
      const { result, duration } = await measureTime(async () => {
        await adapter.navigate(this.testUrl);
        await adapter.waitFor({ type: "load" });

        // Fill login credentials
        const usernameSelectors = ['input[name="custname"], input[type="email"], #username, #email'];
        const passwordSelectors = ['input[name="password"], input[type="password"], #password'];

        let usernameFilled = false;
        let passwordFilled = false;

        // Fill username/email
        for (const selector of usernameSelectors) {
          try {
            await adapter.type(selector, this.credentials.username);
            usernameFilled = true;
            break;
          } catch {
            // Try next
          }
        }

        // Fill password (httpbin doesn't have password, use any text field)
        for (const selector of passwordSelectors) {
          try {
            await adapter.type(selector, this.credentials.password);
            passwordFilled = true;
            break;
          } catch {
            // Try next
          }
        }

        // Submit
        let submitted = false;
        try {
          await adapter.click('button[type="submit"], input[type="submit"]');
          await adapter.waitFor({ type: "networkIdle" });
          submitted = true;
        } catch {
          // Submit failed
        }

        return {
          usernameFilled,
          passwordFilled,
          submitted,
          finalUrl: await adapter.getCurrentUrl(),
        };
      });

      const filledFields = (result.usernameFilled ? 1 : 0) + (result.passwordFilled ? 1 : 0);
      const quality = calculateFormQuality(filledFields, 2, result.submitted ? 1 : 0, 1);

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

export function createFormFillingScenario(config?: ScenarioConfig): FormFillingScenario {
  return new FormFillingScenario(config);
}

export default FormFillingScenario;
