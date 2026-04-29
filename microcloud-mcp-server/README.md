# microcloud-mcp-server

Scaffold MCP server for microcloud operations.

## Status

This is an initial scaffold. It exposes a minimal health tool and is intended to grow into the live adapter for:
- read-only operations
- mutating operations with approval gates
- normalized result envelopes
- audit and trace correlation

## Planned Domains
- cluster status
- node join planning
- bootstrap and reconfiguration workflows

## Environment

Add service-specific credentials and configuration as this server is implemented.

## Implemented Tools

- `health`
- `cluster_status`
- `node_status`
- `storage_status`
- `network_status`

Each read-only tool executes a configured shell command. Defaults use `microcloud status`, and each action can be overridden with environment variables:
- `MICROCLOUD_CLUSTER_STATUS_CMD`
- `MICROCLOUD_NODE_STATUS_CMD`
- `MICROCLOUD_STORAGE_STATUS_CMD`
- `MICROCLOUD_NETWORK_STATUS_CMD`
