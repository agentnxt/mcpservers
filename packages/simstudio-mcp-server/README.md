# SimStudio MCP Server

MCP server for [SimStudio](https://github.com/simstudy/sim) (Sim) — create, execute, and deploy AI agent workflows.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SIMSTUDIO_URL` | Yes | Base URL of your SimStudio instance (e.g. `http://localhost:3000`) |
| `SIMSTUDIO_API_KEY` | Yes | SimStudio API key for authentication |

## Tools (11)

### Workflows
- **list_workflows** — List all workflows
- **get_workflow** — Get a workflow by ID
- **create_workflow** — Create a new workflow
- **update_workflow_state** — Update a workflow's state
- **execute_workflow** — Execute a workflow
- **deploy_workflow** — Deploy a workflow
- **duplicate_workflow** — Duplicate an existing workflow
- **get_workflow_logs** — Get execution logs for a workflow

### Deployments
- **get_deployments** — List all deployments

### Templates & Workspaces
- **list_templates** — List available workflow templates
- **list_workspaces** — List all workspaces

## Usage

```json
{
  "mcpServers": {
    "simstudio": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "SIMSTUDIO_URL": "http://localhost:3000",
        "SIMSTUDIO_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```
