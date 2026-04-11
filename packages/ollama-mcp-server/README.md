# Ollama MCP Server

MCP server for [Ollama](https://ollama.ai/) — manage and run local LLM models.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OLLAMA_URL` | No | Base URL of your Ollama instance (default: `http://ollama:11434`) |

## Tools (9)

### Models
- **list_models** — List all locally available models
- **show_model** — Show details of a specific model
- **pull_model** — Pull/download a model from the registry
- **delete_model** — Delete a local model
- **create_model** — Create a custom model from a Modelfile
- **list_running** — List currently running models

### Inference
- **generate** — Generate a text completion
- **chat** — Send a chat message to a model
- **embeddings** — Generate embeddings for text

## Usage

```json
{
  "mcpServers": {
    "ollama": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434"
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
