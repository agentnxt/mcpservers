# Typebot MCP Server

MCP server for the [Typebot](https://typebot.io/) conversational form builder API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TYPEBOT_URL` | Yes | Base URL of your Typebot instance (e.g. `https://typebot.example.com`) |
| `TYPEBOT_API_TOKEN` | Yes | Typebot API token for authentication |

## Tools (15)

### Chat
- **start_chat** — Start a new chat session with a typebot
- **continue_chat** — Continue an existing chat session
- **preview_chat** — Preview a typebot chat

### Typebots
- **list_typebots** — List all typebots
- **get_typebot** — Get a typebot by ID
- **create_typebot** — Create a new typebot
- **update_typebot** — Update a typebot
- **delete_typebot** — Delete a typebot
- **publish_typebot** — Publish a typebot
- **unpublish_typebot** — Unpublish a typebot

### Results
- **list_results** — List results for a typebot
- **get_result** — Get a specific result
- **delete_results** — Delete results

### Workspaces
- **list_workspaces** — List all workspaces
- **create_workspace** — Create a new workspace

## Usage

```json
{
  "mcpServers": {
    "typebot": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "TYPEBOT_URL": "https://typebot.example.com",
        "TYPEBOT_API_TOKEN": "your-api-token"
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
