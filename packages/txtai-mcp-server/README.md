# txtai MCP Server

MCP server for [txtai](https://github.com/neuml/txtai) — AI-powered semantic search and embeddings.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TXTAI_URL` | Yes | Base URL of your txtai API instance (e.g. `http://txtai:8000`) |

## Tools (5)

### Search & Indexing
- **txtai_search** — Search the embeddings index with a text query
- **txtai_add** — Add documents to the index (call txtai_index after to persist)
- **txtai_index** — Trigger a reindex of all added documents

### Analysis
- **txtai_similarity** — Compute similarity scores between a query and a list of texts
- **txtai_transform** — Run a text transformation pipeline

## Usage

```json
{
  "mcpServers": {
    "txtai": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "TXTAI_URL": "http://localhost:8000"
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
