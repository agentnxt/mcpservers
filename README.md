# MCPHub by AgentNxt

**Production-ready MCP servers for your entire stack. 37 servers, 900+ tools.**

---

## Overview

MCPHub is a monorepo of production-grade Model Context Protocol (MCP) servers that give AI agents direct, tool-based access to the platforms you already run. Each server exposes a focused set of tools -- create, read, update, delete, search, configure -- so Claude, GPT, or any MCP-compatible client can operate your infrastructure, marketing stack, analytics, billing, messaging, and more without custom glue code. Every server ships as a standalone TypeScript package with consistent configuration, authentication handling, and error reporting.

---

## Servers

| # | Server | Service | Tools (est.) | Auth | Language |
|---|--------|---------|:------------:|------|----------|
| 1 | argilla-mcp-server | Argilla | ~18 | API key | TypeScript |
| 2 | calcom-mcp-server | Cal.com | ~29 | API key | TypeScript |
| 3 | camunda-mcp-server | Camunda | ~20 | OAuth2 | TypeScript |
| 4 | erpnext-mcp-server | ERPNext | ~27 | API key + secret | TypeScript |
| 5 | evidently-mcp-server | Evidently AI | ~12 | Bearer | TypeScript |
| 6 | evolution-mcp-server | Evolution API / WhatsApp | ~18 | API key | TypeScript |
| 7 | glitchtip-mcp-server | GlitchTip | ~14 | Bearer | TypeScript |
| 8 | grafana-mcp-server | Grafana | ~40 | API key | TypeScript |
| 9 | lago-mcp-server | Lago Billing | ~43 | Bearer | TypeScript |
| 10 | langflow-mcp-server | Langflow | ~18 | Bearer | TypeScript |
| 11 | liferay-mcp-server | Liferay | ~26 | Basic auth | TypeScript |
| 12 | limesurvey-mcp-server | LimeSurvey | ~18 | JSON-RPC session | TypeScript |
| 13 | litellm-mcp-server | LiteLLM | ~20 | Master key | TypeScript |
| 14 | marquez-mcp-server | Marquez / OpenLineage | ~15 | Optional Bearer | TypeScript |
| 15 | matomo-mcp-server | Matomo Analytics | ~32 | token_auth | TypeScript |
| 16 | mautic-mcp-server | Mautic | ~37 | Basic auth | TypeScript |
| 17 | mlflow-mcp-server | MLflow | ~20 | Optional Bearer | TypeScript |
| 18 | n8n-mcp-server | n8n | ~29 | API key | TypeScript |
| 19 | nextcloud-mcp-server | Nextcloud | ~20 | Basic auth | TypeScript |
| 20 | nocodb-mcp-server | NocoDB | ~33 | API token | TypeScript |
| 21 | opa-mcp-server | Open Policy Agent | ~12 | Optional Bearer | TypeScript |
| 22 | postiz-mcp-server | Postiz Social | ~13 | Bearer | TypeScript |
| 23 | qdrant-mcp-server | Qdrant | ~18 | Optional API key | TypeScript |
| 24 | searxng-mcp-server | SearXNG | ~5 | None | TypeScript |
| 25 | skyvern-mcp-server | Skyvern | ~12 | API key | TypeScript |
| 26 | stalwart-mcp-server | Stalwart Mail | ~15 | Basic auth | TypeScript |
| 27 | surrealdb-mcp-server | SurrealDB | ~12 | Basic auth | TypeScript |
| 28 | temporal-mcp-server | Temporal | ~16 | Optional Bearer | TypeScript |
| 29 | tuwunel-mcp-server | Tuwunel / Matrix | ~20 | Bearer | TypeScript |
| 30 | typebot-mcp-server | Typebot | ~15 | Bearer | TypeScript |
| 31 | uptime-kuma-mcp-server | Uptime Kuma | ~18 | JWT | TypeScript |
| 32 | woocommerce-mcp-server | WooCommerce | ~28 | Consumer key / secret | TypeScript |
| 33 | wuzapi-mcp-server | Wuzapi / WhatsApp | ~13 | Token | TypeScript |
| 34 | zabbix-mcp-server | Zabbix | ~18 | JSON-RPC | TypeScript |
| 35 | ghost-mcp-server | Ghost CMS | 38 | JWT | TypeScript |
| 36 | logto-mcp-server | Logto | 120+ | M2M tokens | TypeScript |
| 37 | hostinger-mcp | Hostinger | 78 | Bearer | TypeScript |

---

## Quick Start

Add any server to your Claude Desktop configuration at `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["path/to/mcpservers/packages/n8n-mcp-server/dist/index.js"],
      "env": {
        "N8N_BASE_URL": "https://n8n.example.com",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```

Replace the server name, path, and environment variables to match whichever server you want to use. Each server's own README documents the exact environment variables it expects.

---

## Development

```bash
# Install all dependencies (from the repo root)
npm install

# Build every server
npm run build

# Build a single server
npm run build --workspace=packages/n8n-mcp-server
```

Each package lives under `packages/` and follows the standard layout:

```
packages/<server-name>/
  src/
    index.ts        # MCP server entry point
    tools/          # Tool definitions
    api/            # API client
  package.json
  tsconfig.json
```

---

Copyright 2026. All rights reserved AgentNxt. An Autonomyx Platform.
