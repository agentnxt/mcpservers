# Unboxd Platform MCP Roadmap

## First Wave

- `microcloud-mcp-server`
- `lxc-mcp-server`
- `ansible-mcp-server`
- `terraform-mcp-server`
- `gcloud-run-mcp-server`

## Design Rules

- separate read-only and mutating operations
- require approval gates for mutating operations
- emit normalized result envelopes
- include audit and trace correlation metadata
- keep credentials outside prompt state
