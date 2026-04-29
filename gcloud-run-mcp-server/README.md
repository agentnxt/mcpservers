# gcloud-run-mcp-server

MCP server for read-only Google Cloud Run operations.

## Status

**Read-only only** - This server exposes only read-only tools. No mutating operations are implemented.

## Tools

| Tool | Description |
|------|-------------|
| `health` | Return server health and configured gcloud command bindings. |
| `list_services` | List all Cloud Run services in JSON format. |
| `describe_service` | Describe a specific Cloud Run service in JSON format. |
| `list_revisions` | List all revisions for a Cloud Run service in JSON format. |
| `read_logs` | Read logs from a Cloud Run service with bounded limit. |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GCLOUD_BIN` | Path to gcloud binary. | `gcloud` |
| `GCLOUD_PROJECT` | GCP project ID. | (empty) |
| `GCLOUD_REGION` | GCP region. | `us-central1` |

## Requirements

- gcloud CLI must be installed and accessible in PATH or via `GCLOUD_BIN`.
- User must be authenticated with gcloud (`gcloud auth login`) or use a service account.
- Required API: Cloud Run API must be enabled for the project.

## Bounded Log Behavior

- `read_logs` defaults to a limit of 50 entries.
- The limit can be overridden via the `limit` parameter.
- Logs are never tailed indefinitely.

## Input Schemas

### list_services
```json
{
  "project": "optional string - GCP project ID",
  "region": "optional string - GCP region"
}
```

### describe_service
```json
{
  "service": "string - required service name",
  "project": "optional string - GCP project ID",
  "region": "optional string - GCP region"
}
```

### list_revisions
```json
{
  "service": "optional string - service name to filter by",
  "project": "optional string - GCP project ID",
  "region": "optional string - GCP region"
}
```

### read_logs
```json
{
  "service": "string - required service name",
  "project": "optional string - GCP project ID",
  "region": "optional string - GCP region",
  "limit": "optional number - max log entries (default 50)"
}
```

## Result Envelope

Every tool returns a normalized JSON envelope:

```json
{
  "tool": "gcloud",
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
