# Ghost MCP Server

MCP server for the [Ghost](https://ghost.org/) CMS Admin API — manage posts and tags.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GHOST_URL` | Yes | Base URL of your Ghost instance (e.g. `https://blog.example.com`) |
| `GHOST_ADMIN_KEY` | Yes | Ghost Admin API key in `{id}:{secret}` format |

## Tools (6)

### Posts
- **ghost_list_posts** — List posts with filtering, pagination, and field selection
- **ghost_get_post** — Get a specific post by ID
- **ghost_create_post** — Create a new post (draft, published, or scheduled)
- **ghost_update_post** — Update an existing post
- **ghost_delete_post** — Delete a post

### Tags
- **ghost_list_tags** — List all tags with optional post counts

## Usage

```json
{
  "mcpServers": {
    "ghost": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GHOST_URL": "https://blog.example.com",
        "GHOST_ADMIN_KEY": "your-key-id:your-key-secret"
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
