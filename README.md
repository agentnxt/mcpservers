# MCPHub by AgentNxt

**Production-ready MCP servers for your entire stack. 58 servers, 1000+ tools.**

---

## Quick Start (Docker)

```bash
# Pull and run any server from Docker Hub
docker run -d \
  -e SERVICE_URL="https://your-service.com" \
  -e SERVICE_API_KEY="your-api-key" \
  agentnxt/<server-name>

# Example: filesystem server
docker run -d \
  -e ALLOWED_DIRECTORIES="/data" \
  agentnxt/filesystem-mcp-server
```

All images are available on Docker Hub: https://hub.docker.com/u/agentnxt

---

## Quick Start (Node.js)

```bash
# Clone the repo
git clone https://github.com/agentnxt/mcpservers.git
cd mcpservers

# Build a server
cd filesystem-mcp-server
npm install
npm run build

# Run directly
node dist/index.js
```

Or add to Claude Desktop:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "node",
      "args": ["/path/to/mcpservers/filesystem-mcp-server/dist/index.js"],
      "env": {
        "ALLOWED_DIRECTORIES": "/data"
      }
    }
  }
}
```

---

## Available Servers (58)

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
