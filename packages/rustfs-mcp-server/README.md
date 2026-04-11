# RustFS MCP Server

MCP server for [RustFS](https://github.com/nickel-org/rustfs) — an S3-compatible object storage server (MinIO-compatible console API).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RUSTFS_URL` | Yes | Console URL of your RustFS instance (e.g. `http://rustfs:9001`) |
| `RUSTFS_ACCESS_KEY` | Yes | Access key for authentication |
| `RUSTFS_SECRET_KEY` | Yes | Secret key for authentication |

## Tools (4)

### Buckets & Objects
- **rustfs_list_buckets** — List all storage buckets
- **rustfs_list_objects** — List objects in a bucket with optional prefix filter
- **rustfs_create_bucket** — Create a new bucket with optional locking and versioning
- **rustfs_delete_object** — Delete an object from a bucket

## Usage

```json
{
  "mcpServers": {
    "rustfs": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "RUSTFS_URL": "http://localhost:9001",
        "RUSTFS_ACCESS_KEY": "your-access-key",
        "RUSTFS_SECRET_KEY": "your-secret-key"
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
