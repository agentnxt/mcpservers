# lxc-mcp-server

MCP server for read-only LXC (Linux Containers) operations.

## Status

**Read-only only** - This server exposes only read-only tools. No mutating operations are implemented.

## Tools

| Tool | Description |
|------|-------------|
| `health` | Return server health and configured LXC command bindings. |
| `list_instances` | List all LXC instances in JSON format. |
| `instance_info` | Get detailed information about a specific LXC instance. |
| `list_images` | List all available LXC images in JSON format. |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LXC_BIN` | Path to LXC binary. | `lxc` |

## Requirements

- LXC CLI must be installed and accessible in PATH or via `LXC_BIN`.
- Requires proper LXC permissions to access instances and images.

## JSON Preference

- `list_instances` and `list_images` prefer JSON output (`--format json`).
- `instance_info` returns raw text output as the LXC CLI does not support JSON for this command.

## Input Schemas

### instance_info
```json
{
  "name": "string - required instance name"
}
```

## Result Envelope

Every tool returns a normalized JSON envelope:

```json
{
  "tool": "lxc",
  "action": "string",
  "status": "ok|error",
  "summary": "short human-readable outcome",
  "stdout": "captured output or serialized structured output",
  "stderr": "captured errors",
  "exit_code": 0,
  "requires_approval": false,
  "rollback_hint": "what to do if this fails"
}
```
