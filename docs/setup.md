# Setup Guide

Complete installation and configuration guide to reproduce all benchmarks locally.

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Detailed Installation](#detailed-installation)
  - [1. Install Bun](#1-install-bun)
  - [2. Clone and Install](#2-clone-and-install)
  - [3. Install Playwright Browsers](#3-install-playwright-browsers)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
- [Tool-Specific Setup](#tool-specific-setup)
  - [playwright-mcp](#playwright-mcp)
  - [playwriter](#playwriter)
  - [firecrawl](#firecrawl)
  - [browser-use](#browser-use)
  - [dev3000](#dev3000)
  - [claude-code-chrome](#claude-code-chrome)
  - [stagehand](#stagehand)
  - [browserbase-mcp](#browserbase-mcp)
- [Running Benchmarks](#running-benchmarks)
- [Token Usage Tracking](#token-usage-tracking)
- [Troubleshooting](#troubleshooting)

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | macOS 12+, Ubuntu 20.04+, Windows 10+ | macOS 14+, Ubuntu 22.04+ |
| **Node.js** | 22.0.0 | 22.x LTS |
| **Bun** | 1.1.0 | Latest |
| **RAM** | 8GB | 16GB |
| **Disk** | 5GB free | 10GB free |
| **Browser** | Chrome 120+ | Chrome latest |

### Required API Keys Per Tool

Not all tools require API keys! Here's what you need for each:

| Tool | Required Environment Variables | Where to Get |
|------|-------------------------------|--------------|
| **playwright-mcp** | _None_ | Just works via npx |
| **playwriter** | _None_ | Chrome extension only |
| **firecrawl** | `FIRECRAWL_API_KEY` | [firecrawl.dev](https://firecrawl.dev/) |
| **browser-use** | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| **dev3000** | _None_ | Just works |
| **claude-code-chrome** | _None (requires Claude Pro subscription)_ | [claude.ai](https://claude.ai/) |
| **stagehand** | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | [platform.openai.com](https://platform.openai.com/) |
| **browserbase-mcp** | `BROWSERBASE_API_KEY` + `BROWSERBASE_PROJECT_ID` | [browserbase.com](https://www.browserbase.com/) |

> 💡 **Tip**: You only need API keys for the tools you plan to benchmark. Start with `playwright-mcp` or `playwriter` - they require no API keys!

---

## Quick Start

```bash
# 1. Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# 2. Clone the repository
git clone https://github.com/user/browser-automation-benchmark
cd browser-automation-benchmark

# 3. Install dependencies
bun install

# 4. Install Playwright browsers
bunx playwright install chromium

# 5. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 6. Run a quick test
bun run benchmark:scraping --adapter=playwright-mcp
```

---

## Detailed Installation

### 1. Install Bun

Bun is the JavaScript runtime used for this benchmark suite.

**macOS / Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Verify installation:**
```bash
bun --version
# Should output 1.1.0 or higher
```

### 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/user/browser-automation-benchmark
cd browser-automation-benchmark

# Install all dependencies
bun install

# Verify installation
bun run typecheck
```

### 3. Install Playwright Browsers

Several tools (playwright-mcp, stagehand) require Playwright browsers:

```bash
# Install Chromium (required)
bunx playwright install chromium

# Optional: Install all browsers for cross-browser testing
bunx playwright install

# Install system dependencies (Linux only)
bunx playwright install-deps chromium
```

### 4. Configure Environment Variables

```bash
# Create .env file from template
cp .env.example .env

# Edit with your preferred editor
nano .env
# or
code .env
```

See [Environment Variables Reference](#environment-variables-reference) for all options.

---

## Tool-Specific Setup

### playwright-mcp

**Microsoft's official MCP server for Playwright.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | _None required_ |
| **Browser** | Chromium (auto-installed) |
| **Setup Time** | ~1 minute |

**Install Playwright browsers:**
```bash
bunx playwright install chromium
```

**Test the installation:**
```bash
npx @playwright/mcp@latest --help
```

**MCP Configuration (for Claude Desktop):**
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

**No `.env` configuration needed for playwright-mcp!**

---

### playwriter

**Chrome extension + MCP for full Playwright API access.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | _None required_ |
| **Browser** | Chrome with extension |
| **Setup Time** | ~2 minutes |

1. **Install the Chrome Extension:**
   - Visit [Chrome Web Store - Playwriter](https://chromewebstore.google.com/detail/playwriter)
   - Click "Add to Chrome"

2. **Start the MCP Server:**
   ```bash
   npx playwriter
   ```

3. **MCP Configuration:**
   ```json
   {
     "mcpServers": {
       "playwriter": {
         "command": "npx",
         "args": ["playwriter"]
       }
     }
   }
   ```

**No `.env` configuration needed for playwriter!**

**Note:** Playwriter requires a visible Chrome browser - no headless mode.

---

### firecrawl

**Web scraping API for LLM-ready content.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | `FIRECRAWL_API_KEY` ✅ Required |
| **Browser** | None (cloud-based) |
| **Setup Time** | ~3 minutes |

1. **Get API Key:**
   - Sign up at [firecrawl.dev](https://firecrawl.dev/)
   - Go to Dashboard → API Keys
   - Copy your API key (starts with `fc-`)

2. **Add to `.env` file:**
   ```bash
   # ┌────────────────────────────────────────────────────────────────────────┐
   # │ TOOL: firecrawl                                                        │
   # └────────────────────────────────────────────────────────────────────────┘
   FIRECRAWL_API_KEY=fc-your-api-key-here
   ```

3. **Test the connection:**
   ```bash
   # Load .env first
   source .env
   
   curl -X POST https://api.firecrawl.dev/v1/scrape \
     -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com"}'
   ```

**Self-hosting (optional):**
```bash
# Clone firecrawl
git clone https://github.com/firecrawl/firecrawl
cd firecrawl

# Run with Docker
docker-compose up -d

# Add to .env (use local URL instead)
FIRECRAWL_API_URL=http://localhost:3002
```

---

### browser-use

**Python AI browser agent with multi-provider LLM support.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` ✅ Required (one of) |
| **Browser** | Chromium (via Playwright) |
| **Setup Time** | ~5 minutes |

1. **Install Python 3.11+:**
   ```bash
   # macOS
   brew install python@3.11
   
   # Ubuntu
   sudo apt install python3.11 python3.11-venv
   ```

2. **Create virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install browser-use:**
   ```bash
   pip install browser-use
   ```

4. **Install Playwright for Python:**
   ```bash
   playwright install chromium
   ```

5. **Add to `.env` file (choose one LLM provider):**
   ```bash
   # ┌────────────────────────────────────────────────────────────────────────┐
   # │ TOOL: browser-use                                                      │
   # │ Required: ANTHROPIC_API_KEY or OPENAI_API_KEY (at least one)           │
   # └────────────────────────────────────────────────────────────────────────┘
   
   # Option A: Anthropic (recommended)
   # Get from: https://console.anthropic.com/
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   
   # Option B: OpenAI
   # Get from: https://platform.openai.com/api-keys
   # OPENAI_API_KEY=sk-proj-your-key-here
   ```

6. **Test the installation:**
   ```python
   from browser_use import Agent
   agent = Agent(task="Go to google.com")
   ```

---

### dev3000

**Debugging assistant for web app development.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | _None required_ |
| **Browser** | Chrome (with extension) |
| **Setup Time** | ~2 minutes |

1. **Install globally:**
   ```bash
   pnpm install -g dev3000
   # or
   npm install -g dev3000
   ```

2. **Start dev3000:**
   ```bash
   cd your-web-project
   dev3000
   ```

3. **MCP Configuration:**
   ```json
   {
     "mcpServers": {
       "dev3000": {
         "command": "dev3000",
         "args": ["--mcp"]
       }
     }
   }
   ```

**No `.env` configuration needed for dev3000!**

**Note:** dev3000 is designed for debugging during development, not general automation.

---

### claude-code-chrome

**Claude Code CLI with Chrome extension integration.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | _None (uses Claude subscription)_ |
| **Subscription** | Claude Pro/Team/Enterprise ✅ Required |
| **Browser** | Chrome with Claude extension |
| **Setup Time** | ~5 minutes |

1. **Requirements:**
   - Claude Pro, Team, or Enterprise subscription ($20+/month)
   - Google Chrome browser
   - Claude Code CLI (v2.0.73+)
   - Claude in Chrome extension (v1.0.36+)

2. **Install Claude Code CLI:**
   ```bash
   # Follow instructions at https://code.claude.com
   # Usually installed via:
   curl -fsSL https://code.claude.com/install.sh | bash
   ```

3. **Install Claude in Chrome Extension:**
   - Visit [Chrome Web Store - Claude](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn)
   - Click "Add to Chrome"

4. **Start with Chrome integration:**
   ```bash
   claude --chrome
   ```

5. **Verify connection:**
   ```bash
   # In Claude Code, type:
   /chrome
   ```

**No `.env` configuration needed** - authentication uses your Claude subscription.

**Note:** Claude Code Chrome requires a visible browser window (no headless mode).

---

### stagehand

**AI-powered browser automation SDK with natural language commands.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` ✅ Required (one of) |
| **Browser** | Chromium (via Playwright) |
| **Setup Time** | ~3 minutes |

1. **Install Stagehand:**
   ```bash
   bun add @browserbase/stagehand
   ```

2. **Add to `.env` file (choose one LLM provider):**
   ```bash
   # ┌────────────────────────────────────────────────────────────────────────┐
   # │ TOOL: stagehand                                                        │
   # │ Required: OPENAI_API_KEY or ANTHROPIC_API_KEY (at least one)           │
   # └────────────────────────────────────────────────────────────────────────┘
   
   # Option A: OpenAI (recommended for stagehand)
   # Get from: https://platform.openai.com/api-keys
   OPENAI_API_KEY=sk-proj-your-key-here
   
   # Option B: Anthropic
   # Get from: https://console.anthropic.com/
   # ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   ```

3. **Test the installation:**
   ```typescript
   import { Stagehand } from "@browserbase/stagehand";
   
   const stagehand = new Stagehand({ env: "LOCAL" });
   await stagehand.init();
   await stagehand.page.goto("https://example.com");
   await stagehand.act({ action: "Click the 'More information' link" });
   ```

**Using with Browserbase Cloud (optional):**
```bash
# Add to .env for cloud mode
BROWSERBASE_API_KEY=your-key
BROWSERBASE_PROJECT_ID=your-project-id
```

```typescript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  apiKey: process.env.BROWSERBASE_API_KEY,
  projectId: process.env.BROWSERBASE_PROJECT_ID,
});
```

---

### browserbase-mcp

**Cloud browser automation with Stagehand AI via MCP.**

| Requirement | Value |
|-------------|-------|
| **Env Vars** | `BROWSERBASE_API_KEY` + `BROWSERBASE_PROJECT_ID` ✅ Both Required |
| **Browser** | Cloud (no local browser needed) |
| **Setup Time** | ~5 minutes |

1. **Get Browserbase Credentials:**
   - Sign up at [browserbase.com](https://www.browserbase.com/)
   - Go to Dashboard → Settings → API Keys
   - Copy your API key
   - Go to Projects → Copy your Project ID

2. **Add to `.env` file:**
   ```bash
   # ┌────────────────────────────────────────────────────────────────────────┐
   # │ TOOL: browserbase-mcp                                                  │
   # │ Required: BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID                 │
   # └────────────────────────────────────────────────────────────────────────┘
   
   # Get from: https://www.browserbase.com/
   BROWSERBASE_API_KEY=bb_live_your-api-key-here
   BROWSERBASE_PROJECT_ID=your-project-id-here
   ```

3. **MCP Configuration (for Claude Desktop):**
   ```json
   {
     "mcpServers": {
       "browserbase": {
         "command": "npx",
         "args": ["@anthropic-ai/mcp-server-browserbase"],
         "env": {
           "BROWSERBASE_API_KEY": "${BROWSERBASE_API_KEY}",
           "BROWSERBASE_PROJECT_ID": "${BROWSERBASE_PROJECT_ID}"
         }
       }
     }
   }
   ```

4. **Test the connection:**
   ```bash
   # Load .env first
   source .env
   
   npx @anthropic-ai/mcp-server-browserbase
   ```

---

## Running Benchmarks

### Run All Benchmarks

```bash
# Run full suite with all adapters
bun run benchmark

# Run with specific model
bun run benchmark --model=claude-opus-4-5
```

### Run Specific Scenarios

```bash
# Web scraping benchmark
bun run benchmark:scraping

# Navigation & interaction
bun run benchmark:navigation

# Debugging & log capture
bun run benchmark:debugging

# Form filling
bun run benchmark:forms

# Web search
bun run benchmark:search

# Structured data extraction
bun run benchmark:structured
```

### Run Specific Adapters

```bash
# Single adapter
bun run benchmark --adapter=playwright-mcp

# Multiple adapters
bun run benchmark --adapter=playwright-mcp,stagehand,firecrawl
```

### Run with Options

```bash
# Headless mode (where supported)
bun run benchmark --headless

# Multiple runs for statistical significance
bun run benchmark --runs=5

# Verbose output
bun run benchmark --verbose
```

### View Results

```bash
# Display formatted results
bun run results

# Results are also saved to docs/results.md
```

---

## Token Usage Tracking

We use [ccusage](https://ccusage.com/guide/) to track Claude Code token consumption.

### Install ccusage

```bash
# No installation needed - runs via bunx/npx
bunx ccusage --help
```

### Track Usage

```bash
# View daily usage
bunx ccusage daily

# View session-based usage
bunx ccusage session

# View usage for specific date range
bunx ccusage daily --from=2024-01-01 --to=2024-01-31

# Export as JSON
bunx ccusage daily --json > usage.json
```

### Cost Estimation

The benchmark uses Claude Opus 4.5 pricing by default:

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------:|------------------------:|
| Claude Opus 4.5 | $5.00 | $25.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $1.00 | $5.00 |

---

## Environment Variables Reference

### Quick Reference Table

| Variable | Required For | Example Value |
|----------|--------------|---------------|
| `ANTHROPIC_API_KEY` | browser-use, stagehand | `sk-ant-api03-xxxxx` |
| `OPENAI_API_KEY` | stagehand (alternative) | `sk-proj-xxxxx` |
| `FIRECRAWL_API_KEY` | firecrawl | `fc-xxxxx` |
| `BROWSERBASE_API_KEY` | browserbase-mcp | `bb_live_xxxxx` |
| `BROWSERBASE_PROJECT_ID` | browserbase-mcp | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |

### Minimal Setup (No API Keys)

These tools work without any API keys:
- ✅ playwright-mcp
- ✅ playwriter
- ✅ dev3000
- ✅ claude-code-chrome (requires Claude subscription instead)

### Full `.env` Template

```bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║     Copy this to .env and fill in ONLY the keys for tools you need          ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

# ┌─ LLM PROVIDERS (for browser-use, stagehand) ─────────────────────────────────┐
# │ You need at least ONE of these for AI-powered tools                          │
# └──────────────────────────────────────────────────────────────────────────────┘
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# ┌─ FIRECRAWL ──────────────────────────────────────────────────────────────────┐
FIRECRAWL_API_KEY=

# ┌─ BROWSERBASE ────────────────────────────────────────────────────────────────┐
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=

# ┌─ BENCHMARK CONFIG ───────────────────────────────────────────────────────────┐
BENCHMARK_MODEL=claude-opus-4-5
HEADLESS=false
BENCHMARK_RUNS=3
RESULTS_DIR=./results
VERBOSE=false
```

---

## Troubleshooting

### Common Issues

#### "Playwright browsers not found"

```bash
# Install browsers
bunx playwright install chromium

# On Linux, install system dependencies
bunx playwright install-deps chromium
```

#### "ANTHROPIC_API_KEY not set"

```bash
# Check if .env file exists
cat .env | grep ANTHROPIC

# Or export directly
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

#### "Chrome extension not detected" (claude-code-chrome)

1. Verify Claude in Chrome extension is installed (v1.0.36+)
2. Ensure Chrome is running
3. In Claude Code, run `/chrome` and select "Reconnect extension"
4. Restart both Claude Code and Chrome

#### "Playwriter: No connection to extension"

1. Ensure the Playwriter Chrome extension is installed
2. Make sure Chrome is running with the extension enabled
3. Try restarting the npx server: `npx playwriter`

#### "Firecrawl: 401 Unauthorized"

```bash
# Verify your API key is correct
curl -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  https://api.firecrawl.dev/v1/scrape \
  -d '{"url": "https://example.com"}'
```

#### "browser-use: Module not found"

```bash
# Ensure you're in the virtual environment
source venv/bin/activate

# Reinstall browser-use
pip install --upgrade browser-use
```

#### "Stagehand: No LLM response"

1. Check your API key is set correctly
2. Verify you have API credits remaining
3. Try switching between OpenAI and Anthropic:
   ```typescript
   const stagehand = new Stagehand({
     env: "LOCAL",
     modelName: "gpt-4o", // or "claude-sonnet-4-5-20250514"
   });
   ```

#### "Browserbase: Session creation failed"

1. Verify your API key and project ID
2. Check your Browserbase account has available sessions
3. Try creating a session manually via their dashboard

### Getting Help

- **GitHub Issues**: [Report bugs or ask questions](https://github.com/user/browser-automation-benchmark/issues)
- **Discord**: Join the community for real-time help
- **Documentation**: See [methodology.md](methodology.md) and [analysis.md](analysis.md)

### Debug Mode

Run benchmarks with verbose logging:

```bash
DEBUG=* bun run benchmark --verbose
```

---

## Next Steps

After setup is complete:

1. **Run a quick test**: `bun run benchmark:scraping --adapter=playwright-mcp`
2. **Review methodology**: [docs/methodology.md](methodology.md)
3. **Explore results**: [docs/results.md](results.md)
4. **Deep dive into analysis**: [docs/analysis.md](analysis.md)

---

<p align="center">
  <strong>Happy benchmarking! 🚀</strong>
</p>
