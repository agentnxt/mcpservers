# Cognitive Memory Engine MCP Server

MCP server for the [Cognitive Memory Engine](https://github.com/cognitive-memory) — manage AI memory systems for context-aware conversations.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CME_URL` | Yes | Base URL of your Cognitive Memory Engine instance |
| `CME_API_KEY` | Yes | API key for authentication |

## Tools (6)

### Chat Integration
- **cme_chat_pre_llm** — Process context before sending to the LLM
- **cme_chat_post_llm** — Store conversation context after LLM response

### Memory Management
- **cme_list_memories** — List all stored memories
- **cme_create_memory** — Create a new memory entry
- **cme_delete_memory** — Delete a memory by ID

### System
- **cme_health** — Check the health of the CME instance

## Usage

```json
{
  "mcpServers": {
    "cognitive-memory": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "CME_URL": "http://localhost:8000",
        "CME_API_KEY": "your-api-key"
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
