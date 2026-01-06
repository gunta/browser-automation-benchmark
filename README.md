# 🌐 Browser Automation Benchmark

**The definitive comparison of browser automation tools for AI agents**

A comprehensive benchmark suite comparing **8 browser automation tools** across real-world scenarios with measurable metrics including token usage, execution time, and quality of results.

---

## 📊 Quick Comparison

| Tool | Primary Purpose | Best For | Language | MCP Support |
|------|-----------------|----------|----------|-------------|
| **[browser-use](https://github.com/browser-use/browser-use)** | AI Browser Agent | End-to-end browser automation with LLM reasoning | Python | ✅ Server |
| **[browserbase-mcp](https://github.com/browserbase/mcp-server-browserbase)** | Cloud Browser MCP | Scalable cloud browser automation with Stagehand AI | TypeScript | ✅ Server |
| **[claude-code-chrome](https://code.claude.com/docs/en/chrome.md)** | CLI Browser Control | Natural language browser automation from terminal | CLI | ❌ Native |
| **[dev3000](https://github.com/vercel-labs/dev3000)** | Debugging Assistant | Capturing logs, errors, and screenshots during development | TypeScript | ✅ Server |
| **[firecrawl](https://github.com/firecrawl/firecrawl)** | Web Scraping API | Converting websites to LLM-ready markdown/structured data | TypeScript | ✅ [Separate](https://github.com/firecrawl/firecrawl-mcp-server) |
| **[playwriter](https://github.com/remorses/playwriter)** | MCP Browser Control | Full Playwright API via single `execute` tool | TypeScript | ✅ Client |
| **[playwright-mcp](https://github.com/microsoft/playwright-mcp)** | MCP Browser Control | Structured browser automation via accessibility tree | TypeScript | ✅ Server |
| **[stagehand](https://github.com/browserbase/stagehand)** | AI Browser SDK | Natural language browser control with multi-model support | TypeScript | Via browserbase-mcp |

---

## 🔬 Feature Comparison

### Core Capabilities

| Feature | browser-use | browserbase | claude-code | dev3000 | firecrawl | playwriter | playwright-mcp | stagehand |
|---------|:-----------:|:-----------:|:-----------:|:-------:|:---------:|:----------:|:--------------:|:---------:|
| **Web Scraping** | ✅ | ✅ | ✅ | ⚠️ Limited | ✅ Excellent | ✅ | ✅ | ✅ |
| **Navigation & Clicks** | ✅ | ✅ | ✅ | ✅ | ⚠️ Actions | ✅ | ✅ | ✅ |
| **Form Filling** | ✅ | ✅ | ✅ | ✅ | ⚠️ Actions | ✅ | ✅ | ✅ |
| **Screenshot Capture** | ✅ | ✅ | ✅ | ✅ Auto | ✅ | ✅ | ✅ | ✅ |
| **Console Log Capture** | ✅ | ✅ | ✅ | ✅ Excellent | ❌ | ✅ | ✅ | ✅ |
| **Network Request Logging** | ✅ | ✅ | ✅ | ✅ Excellent | ❌ | ✅ | ✅ | ⚠️ |
| **PDF Generation** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ Opt-in | ✅ |
| **Structured Data Extraction** | ✅ | ✅ Excellent | ✅ | ❌ | ✅ Excellent | ✅ | ✅ | ✅ Excellent |
| **Authentication Handling** | ✅ | ✅ | ✅ Excellent | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CAPTCHA Handling** | ✅ Cloud | ✅ Stealth | ⚠️ Manual | ❌ | ✅ Cloud | ⚠️ Manual | ❌ | ✅ Stealth |
| **GIF Recording** | ❌ | ✅ Recording | ✅ Unique | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Live Session View** | ❌ | ✅ Unique | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Browser & Runtime

| Feature | browser-use | browserbase | claude-code | dev3000 | firecrawl | playwriter | playwright-mcp | stagehand |
|---------|:-----------:|:-----------:|:-----------:|:-------:|:---------:|:----------:|:--------------:|:---------:|
| **Browser Engine** | Chromium (CDP) | Cloud Chromium | Chrome (Extension) | Chrome (CDP + Ext) | Headless | Chrome (Extension) | Chromium/FF/WebKit | Chromium |
| **Headless Mode** | ✅ | ✅ Cloud | ❌ Visible | ✅ | ✅ | ❌ Real browser | ✅ | ✅ |
| **Persistent Profile** | ✅ | ✅ Sessions | ✅ Uses yours | ✅ | N/A | ✅ Reuses yours | ✅ | ✅ |
| **Multiple Tabs** | ✅ | ✅ | ✅ | ✅ | N/A | ✅ | ✅ | ✅ |
| **Proxy Support** | ✅ | ✅ Built-in | ✅ Via Chrome | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Cloud Hosting** | ✅ BU Cloud | ✅ Browserbase | ❌ | ❌ | ✅ Firecrawl | ❌ | ❌ | ✅ Browserbase |
| **Parallel Sessions** | ⚠️ | ✅ Excellent | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |

### LLM Integration

| Feature | browser-use | browserbase | claude-code | dev3000 | firecrawl | playwriter | playwright-mcp | stagehand |
|---------|:-----------:|:-----------:|:-----------:|:-------:|:---------:|:----------:|:--------------:|:---------:|
| **Native LLM Support** | ✅ Multi-provider | ✅ Multi-provider | ✅ Claude built-in | Via MCP | API-based | Via MCP | Via MCP | ✅ Multi-provider |
| **Vision/Screenshots to LLM** | ✅ | ✅ | ✅ Native | ✅ | ✅ | ✅ A11y snapshots | ⚠️ Opt-in | ✅ Vision |
| **Context Window Efficiency** | Medium | High | High | Medium | High | High (90% less) | High | High |
| **Custom System Prompts** | ✅ | ✅ | ❌ | ❌ | N/A | ✅ | ❌ | ✅ |
| **Tool Count** | Many actions | 10+ MCP tools | Natural language | 5 tools | API endpoints | 1 tool (`execute`) | 20+ tools | 3 methods |

### Developer Experience

| Feature | browser-use | browserbase | claude-code | dev3000 | firecrawl | playwriter | playwright-mcp | stagehand |
|---------|:-----------:|:-----------:|:-----------:|:-------:|:---------:|:----------:|:--------------:|:---------:|
| **Setup Complexity** | Medium | Easy (API key) | Easy (CLI + ext) | Easy | Easy (API key) | Easy | Easy | Easy |
| **Documentation** | ✅ Excellent | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Excellent |
| **TypeScript Support** | ❌ Python only | ✅ Native | N/A (CLI) | ✅ Native | ✅ SDK available | ✅ Native | ✅ Native | ✅ Native |
| **Python Support** | ✅ Native | ❌ | N/A (CLI) | ❌ | ✅ SDK available | ❌ | ❌ | ❌ |
| **Open Source** | ✅ | ✅ | ❌ Proprietary | ✅ | ✅ AGPL-3.0 | ✅ | ✅ | ✅ MIT |
| **Pricing** | Free/Cloud | Usage-based | Claude Pro+ | Free | Free/Cloud | Free | Free | Free + LLM costs |

---

## 🏗️ Architecture Comparison

### How Each Tool Works

```mermaid
flowchart TB
    subgraph BrowserUse["browser-use"]
        BU_LLM[LLM Provider] --> BU_Agent[Agent]
        BU_Agent --> BU_DOM[DOM Service]
        BU_DOM --> BU_CDP[CDP Client]
        BU_CDP --> BU_Browser[Chromium]
    end

    subgraph Browserbase["browserbase-mcp + stagehand"]
        BB_MCP[MCP Client] --> BB_Server[MCP Server]
        BB_Server --> BB_Stagehand[Stagehand SDK]
        BB_Stagehand --> BB_Cloud[Browserbase Cloud]
        BB_Cloud --> BB_Browsers[Cloud Browsers]
    end

    subgraph ClaudeCode["claude-code-chrome"]
        CC_CLI[Claude Code CLI] --> CC_Native[Native Messaging API]
        CC_Native --> CC_Extension[Claude in Chrome Extension]
        CC_Extension --> CC_Browser[Chrome Browser]
        CC_Browser --> CC_Tabs[Your Logged-in Sessions]
    end

    subgraph Dev3000["dev3000"]
        D3_CLI[CLI] --> D3_Server[Dev Server Monitor]
        D3_Server --> D3_Browser[Headless Browser]
        D3_Browser --> D3_Extension[Chrome Extension]
        D3_Server --> D3_MCP[MCP Server]
    end

    subgraph Firecrawl["firecrawl"]
        FC_API[REST API] --> FC_Crawler[Crawler Engine]
        FC_Crawler --> FC_Browser[Headless Browsers]
        FC_Browser --> FC_Parser[Content Parser]
        FC_Parser --> FC_Output[Markdown/JSON]
    end

    subgraph Playwriter["playwriter"]
        PW_MCP[MCP Client] --> PW_WS[WebSocket Server]
        PW_WS --> PW_Extension[Chrome Extension]
        PW_Extension --> PW_CDP[chrome.debugger API]
        PW_CDP --> PW_Tabs[Browser Tabs]
    end

    subgraph PlaywrightMCP["playwright-mcp"]
        PM_MCP[MCP Client] --> PM_Server[MCP Server]
        PM_Server --> PM_PW[Playwright]
        PM_PW --> PM_Browser[Browser]
        PM_Browser --> PM_A11y[Accessibility Tree]
    end
```

### Interaction Model Comparison

| Aspect | browser-use | browserbase | claude-code | dev3000 | firecrawl | playwriter | playwright-mcp | stagehand |
|--------|-------------|-------------|-------------|---------|-----------|------------|----------------|-----------|
| **Input** | Task description | MCP tools / NL | Natural language | "fix my app" | URL + options | Playwright code | Element refs | act/extract/observe |
| **Processing** | LLM decides | Stagehand AI | Claude interprets | Analyzes logs | Crawls & parses | Executes code | A11y tree | LLM decides |
| **Output** | Task completion | Structured data | Task completion | Fix suggestions | Markdown/JSON | Execution result | Structured data | Typed results |
| **Feedback Loop** | Yes, multi-step | Yes | Yes, interactive | Yes, via MCP | No | Yes | Yes | Yes |

---

## 📈 Benchmark Results

### Test Environment
- **Machine**: Apple Silicon / x86_64
- **Runtime**: Bun 1.x / Node.js 22+
- **Token Tracking**: [ccusage](https://ccusage.com/guide/)
- **LLM**: [Claude Opus 4.5](https://platform.claude.com/docs/en/about-claude/models/overview) (via Claude Code)

### Token Pricing Reference

All benchmark costs calculated using [Anthropic's official pricing](https://platform.claude.com/docs/en/about-claude/models/overview):

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------:|------------------------:|
| **Claude Opus 4.5** | $5.00 | $25.00 |

### Scenario 1: Web Scraping
**Task**: Extract top 5 Hacker News stories (title, points, author, URL)

| Tool | Tokens Used | Time (s) | Success | Quality |
|------|-------------|----------|---------|---------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | N/A | N/A | N/A | N/A |
| firecrawl | TBD | TBD | TBD | TBD |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

### Scenario 2: Navigation & Interaction
**Task**: Navigate to a site, click through 3 pages, capture final state

| Tool | Tokens Used | Time (s) | Success | Quality |
|------|-------------|----------|---------|---------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | TBD | TBD | TBD | TBD |
| firecrawl | N/A | N/A | N/A | N/A |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

### Scenario 3: Debugging & Log Capture
**Task**: Load page with JS errors, capture and report all errors

| Tool | Tokens Used | Time (s) | Errors Found | Log Completeness |
|------|-------------|----------|--------------|------------------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | TBD | TBD | TBD | TBD |
| firecrawl | N/A | N/A | N/A | N/A |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

### Scenario 4: Form Filling
**Task**: Fill multi-field contact form with validation

| Tool | Tokens Used | Time (s) | Fields Correct | Validation Handled |
|------|-------------|----------|----------------|-------------------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | TBD | TBD | TBD | TBD |
| firecrawl | N/A | N/A | N/A | N/A |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

### Scenario 5: Web Search
**Task**: Search "weather Tokyo tomorrow", extract the answer

| Tool | Tokens Used | Time (s) | Answer Found | Accuracy |
|------|-------------|----------|--------------|----------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | N/A | N/A | N/A | N/A |
| firecrawl | TBD | TBD | TBD | TBD |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

### Scenario 6: Structured Data Extraction
**Task**: Extract product data into JSON schema

| Tool | Tokens Used | Time (s) | Schema Valid | Data Accuracy |
|------|-------------|----------|--------------|---------------|
| browser-use | TBD | TBD | TBD | TBD |
| browserbase-mcp | TBD | TBD | TBD | TBD |
| claude-code-chrome | TBD | TBD | TBD | TBD |
| dev3000 | N/A | N/A | N/A | N/A |
| firecrawl | TBD | TBD | TBD | TBD |
| playwriter | TBD | TBD | TBD | TBD |
| playwright-mcp | TBD | TBD | TBD | TBD |
| stagehand | TBD | TBD | TBD | TBD |

---

## 🎯 When to Use Each Tool

### browser-use
**Best for**: Complex, multi-step browser automation tasks requiring LLM reasoning

```python
from browser_use import Agent, ChatBrowserUse

agent = Agent(
    task="Find the cheapest flight from NYC to LA next week",
    llm=ChatBrowserUse(),
)
await agent.run()
```

**Strengths**:
- Native LLM integration with multiple providers
- Sophisticated DOM processing and element detection
- Production-ready with cloud hosting option
- Handles complex, open-ended tasks

**Weaknesses**:
- Python only (no TypeScript/JavaScript)
- Higher token usage due to comprehensive context
- Requires more setup for local development

---

### browserbase-mcp
**Best for**: Scalable cloud browser automation with AI capabilities

```typescript
// Configure MCP server in your client
{
  "mcpServers": {
    "browserbase": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-server-browserbase"]
    }
  }
}

// Stagehand tools available via MCP:
// - stagehand_act: Perform AI-guided actions
// - stagehand_extract: Extract structured data
// - stagehand_observe: Get page state
```

**Strengths**:
- Cloud browser sessions (no local browser needed)
- Parallel session support for scale
- Advanced stealth mode for anti-bot bypassing
- Session recording and live view
- Combines Stagehand AI with cloud infrastructure

**Weaknesses**:
- Requires Browserbase API key
- Cloud-only (no local mode)
- Usage-based pricing

---

### claude-code-chrome
**Best for**: Natural language browser automation with access to your logged-in sessions

```bash
# Start Claude Code with Chrome integration
claude --chrome

# Then describe what you want:
# "Go to Gmail, find emails from John, and summarize them"
# "Fill out this form on the CRM with data from contacts.csv"
# "Record a GIF showing the checkout flow"
```

**Strengths**:
- Natural language task execution (no code required)
- Uses your existing browser session & logins
- Access authenticated apps (Google Docs, Gmail, Notion, etc.)
- GIF recording of browser interactions
- Live debugging with console access
- No separate API keys needed

**Weaknesses**:
- Requires paid Claude plan (Pro/Team/Enterprise)
- No headless mode (browser must be visible)
- Chrome-only (no Firefox/Safari/WebKit)
- Beta feature (still evolving)

**Learn more**: [Claude Code Chrome documentation](https://code.claude.com/docs/en/chrome.md)

---

### dev3000
**Best for**: Debugging web applications during development

```bash
pnpm install -g dev3000
dev3000
# Then tell Claude: "fix my app"
```

**Strengths**:
- Automatic screenshot capture on errors
- Comprehensive log aggregation (server + browser + network)
- Timeline view for debugging
- Works with any web framework

**Weaknesses**:
- Focused on debugging, not general automation
- Requires running dev server
- Limited to development environment

---

### firecrawl
**Best for**: Web scraping and converting websites to structured data

```typescript
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: 'fc-YOUR_KEY' });
const doc = await firecrawl.scrape('https://example.com', {
  formats: ['markdown', 'html'],
});
```

**Strengths**:
- Best-in-class web scraping
- LLM-ready output formats (markdown, structured JSON)
- Handles anti-bot measures
- Excellent for RAG pipelines

**Weaknesses**:
- Limited browser interaction (actions are secondary)
- Requires API key / self-hosting
- Not designed for stateful automation

---

### playwriter
**Best for**: Full Playwright control via MCP with minimal context window usage

```typescript
// In MCP execute tool
await page.goto('https://example.com');
await page.locator('button').click();
const data = await page.locator('.content').textContent();
```

**Strengths**:
- 90% less context window than alternatives
- Full Playwright API access
- Works with your existing browser profile
- Bypass automation detection (disconnect/reconnect)

**Weaknesses**:
- Requires Chrome extension
- Single `execute` tool means less structured output
- No headless mode (uses real browser)

---

### playwright-mcp
**Best for**: Structured browser automation with Microsoft's official MCP implementation

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Strengths**:
- Official Microsoft implementation
- Accessibility tree for reliable element selection
- Many specialized tools for different actions
- Cross-browser support (Chromium, Firefox, WebKit)

**Weaknesses**:
- More tools = more context window usage
- Less flexible than raw Playwright API
- No cloud hosting option

---

### stagehand
**Best for**: AI-powered browser automation with natural language commands

```typescript
import { Stagehand } from "@browserbase/stagehand";

const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Natural language actions
await stagehand.act({ action: "Click the login button" });

// Type-safe extraction with Zod schemas
const data = await stagehand.extract({
  instruction: "Extract all product prices",
  schema: z.object({
    products: z.array(z.object({
      name: z.string(),
      price: z.number(),
    })),
  }),
});

// Observe page state
const state = await stagehand.observe();
```

**Strengths**:
- Natural language actions via `act()`
- Type-safe extraction with Zod schemas
- Multi-model support (GPT-4, Claude)
- Vision capabilities for element detection
- Caching for performance optimization
- Can run locally or with Browserbase cloud

**Weaknesses**:
- Requires LLM API key (OpenAI or Anthropic)
- Higher latency due to LLM calls
- Token costs for AI operations

**Learn more**: [Stagehand documentation](https://docs.stagehand.dev/)

---

## 🔧 Running the Benchmarks

> **📖 Full Setup Guide**: See [docs/setup.md](docs/setup.md) for complete installation instructions for all 8 tools.

### Quick Start

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone this repository
git clone https://github.com/user/browser-automation-benchmark
cd browser-automation-benchmark

# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install chromium

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see docs/setup.md for details)
```

### Running Benchmarks

```bash
# Run full benchmark suite
bun run benchmark

# Run specific scenario
bun run benchmark:scraping
bun run benchmark:navigation
bun run benchmark:debugging
bun run benchmark:forms
bun run benchmark:search
bun run benchmark:structured

# Run specific adapter
bun run benchmark --adapter=playwright-mcp

# Run multiple adapters
bun run benchmark --adapter=stagehand,firecrawl,browserbase-mcp
```

### Viewing Results

```bash
# Display formatted results
bun run results

# Results are also saved to docs/results.md
```

### Token Usage Tracking

This benchmark uses [ccusage](https://ccusage.com/guide/) to track Claude Code token consumption:

```bash
# View daily usage
bunx ccusage daily

# View session-based usage
bunx ccusage session
```

---

## 📚 Documentation

- [**Setup Guide**](docs/setup.md) - Complete installation instructions for all tools
- [Methodology](docs/methodology.md) - How benchmarks are conducted
- [Results](docs/results.md) - Detailed benchmark results
- [Analysis](docs/analysis.md) - In-depth analysis of each tool

---

## 🤝 Contributing

We welcome contributions! To add a new benchmark scenario or improve existing ones:

1. Fork this repository
2. Create a feature branch
3. Add your scenario in `benchmarks/scenarios/`
4. Update the adapter interfaces if needed
5. Submit a pull request

---

## 📖 References

- [Computer-use vs Browser-use vs Playwright-MCP Comparison (Japanese)](https://zenn.dev/headwaters/articles/7f0717b61848c3)
- [ccusage Documentation](https://ccusage.com/guide/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with ❤️ for the AI automation community</strong>
</p>
