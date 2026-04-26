# SOP: Deploying MCP Servers from the AgentNxt Registry

This SOP defines the standard path for running registered MCP servers locally, publishing containers, and deploying remote HTTPS endpoints for clients such as ChatGPT, Claude, Gemini, IDEs, and internal agents.

## Deployment modes

The registry supports three deployment modes:

1. **Local stdio**: best for desktop clients and developer machines.
2. **Containerized stdio**: best for reproducible local or internal usage.
3. **Remote HTTP / Streamable HTTP / SSE**: best for hosted clients that require an HTTPS endpoint.

Every server README should state which modes are supported.

## Local stdio deployment

Use local stdio when the MCP client can launch a process directly.

Example MCP client config:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "SERVICE_API_KEY": "value"
      }
    }
  }
}
```

For Python packages:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "pipx",
      "args": ["run", "package-name"],
      "env": {
        "SERVICE_API_KEY": "value"
      }
    }
  }
}
```

## Containerized local deployment

Build and run the image:

```bash
docker build -t agentnxt/<server-id>:local <server-id>
docker run --rm -i \
  -e SERVICE_API_KEY="value" \
  agentnxt/<server-id>:local
```

For HTTP servers:

```bash
docker run --rm -p 8080:8080 \
  -e SERVICE_API_KEY="value" \
  agentnxt/<server-id>:local
```

## Remote deployment requirements

Remote deployments must provide:

- HTTPS endpoint
- documented transport path, usually `/mcp`
- authentication or a clear reason why no authentication is needed
- least-privilege service identity
- no secrets committed to git
- health or smoke-test instructions
- rollback instructions

## Recommended Cloud Run deployment

Cloud Run is the default hosted deployment target for simple HTTP MCP services and wrappers.

```bash
PROJECT_ID="your-project-id"
REGION="us-central1"
SERVICE="<server-id>"
SERVICE_ACCOUNT="<server-id>@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com

gcloud iam service-accounts create "<server-id>" \
  --display-name="<server-id> runtime" || true

gcloud run deploy "$SERVICE" \
  --source "<server-id>" \
  --region "$REGION" \
  --service-account "$SERVICE_ACCOUNT" \
  --no-allow-unauthenticated \
  --set-env-vars KEY=value
```

Use `--allow-unauthenticated` only for temporary testing or when an upstream gateway already handles authentication.

## Secrets

Use the hosting platform's secret manager instead of plain environment variables for credentials.

For Google Cloud Secret Manager:

```bash
printf '%s' "$SERVICE_API_KEY" | gcloud secrets create service-api-key --data-file=-

gcloud run services update "$SERVICE" \
  --region "$REGION" \
  --set-secrets SERVICE_API_KEY=service-api-key:latest
```

## ChatGPT-compatible remote MCP deployment

ChatGPT custom MCP connectors require a remote HTTPS MCP endpoint. For a server that only supports stdio, wrap it with a bridge such as `mcp-proxy` and expose Streamable HTTP.

Example container command:

```bash
mcp-proxy --host 0.0.0.0 --port ${PORT:-8080} --transport streamable-http -- <stdio-command>
```

The connector URL should be:

```text
https://your-service.example.com/mcp
```

For production, put the endpoint behind OAuth or an authenticated gateway.

## Validation checklist

Before marking a deployment production-ready:

- [ ] Container builds from a clean checkout
- [ ] Runtime starts without local-only files
- [ ] Required APIs or upstream services are enabled
- [ ] Runtime identity has least-privilege access
- [ ] Secrets are injected from a secret manager
- [ ] MCP client can list tools
- [ ] One representative tool call succeeds
- [ ] Logs do not print secrets
- [ ] Endpoint is authenticated when exposed publicly
- [ ] Rollback path is documented

## Rollback

Cloud Run rollback:

```bash
gcloud run revisions list --service "$SERVICE" --region "$REGION"
gcloud run services update-traffic "$SERVICE" \
  --region "$REGION" \
  --to-revisions REVISION_NAME=100
```

Docker image rollback:

```bash
docker pull agentnxt/<server-id>:<previous-version>
docker tag agentnxt/<server-id>:<previous-version> agentnxt/<server-id>:latest
docker push agentnxt/<server-id>:latest
```

## Operational ownership

Every production deployment should have:

- owning team or maintainer
- deployment environment name
- service account identity
- secret names
- upstream API quotas or rate limits
- incident contact
- review date
