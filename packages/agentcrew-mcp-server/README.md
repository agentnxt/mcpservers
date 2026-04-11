# AgentCrew MCP Server

MCP server for [AgentCrew](https://github.com/strnad/CrewAI-Studio) (CrewAI-Studio) — manage agents, tasks, crews, and results.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AGENTCREW_URL` | Yes | Base URL of your AgentCrew instance (e.g. `http://agentcrew:8502`) |

## Tools (11)

### Agents
- **list_agents** — List all AI agents configured in AgentCrew
- **create_agent** — Create a new agent with role, goal, and backstory
- **delete_agent** — Delete an agent by ID

### Tasks
- **list_tasks** — List all tasks
- **create_task** — Create a new task
- **delete_task** — Delete a task by ID

### Crews
- **list_crews** — List all crews
- **delete_crew** — Delete a crew by ID

### Results & Tools
- **list_results** — List execution results
- **list_tools** — List available tools
- **export_all** — Export all agents, tasks, and crews

## Usage

```json
{
  "mcpServers": {
    "agentcrew": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "AGENTCREW_URL": "http://localhost:8502"
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
