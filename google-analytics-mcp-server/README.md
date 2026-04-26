# Google Analytics MCP Server

Read-only MCP server for Google Analytics Admin and GA4 reporting APIs. This package wraps the upstream `analytics-mcp` Python package and exposes it as a remote MCP endpoint for hosted clients that require HTTPS, while preserving local stdio usage.

## Source

- Upstream repository: https://github.com/googleanalytics/google-analytics-mcp
- Python package: `analytics-mcp`
- Runtime: Python 3.10+
- Transport: stdio locally, Streamable HTTP through the Docker wrapper

## Required Google APIs

Enable these APIs in the Google Cloud project used by the runtime identity:

- Google Analytics Admin API
- Google Analytics Data API

## Authentication

For hosted deployments on Google Cloud Run, prefer service identity instead of mounting a credential file.

1. Create a runtime service account.
2. Grant that service account access to the relevant GA4 account or property in Google Analytics Admin.
3. Deploy this container with the service account attached.
4. Set `GOOGLE_CLOUD_PROJECT` to the Google Cloud project ID.

For local development or non-Google hosting, use Application Default Credentials and set `GOOGLE_APPLICATION_CREDENTIALS` to the credentials JSON path.

## Local stdio usage

```bash
pipx run analytics-mcp
```

## Build the remote wrapper

```bash
docker build -t agentnxt/google-analytics-mcp-server:latest .
```

## Run locally over Streamable HTTP

```bash
docker run --rm -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT="your-project-id" \
  -e GOOGLE_APPLICATION_CREDENTIALS="/secrets/application_default_credentials.json" \
  -v "$HOME/.config/gcloud/application_default_credentials.json:/secrets/application_default_credentials.json:ro" \
  agentnxt/google-analytics-mcp-server:latest
```

The MCP endpoint is available at:

```text
http://localhost:8080/mcp
```

## Deploy to Google Cloud Run

```bash
PROJECT_ID="your-project-id"
REGION="us-central1"
SERVICE="google-analytics-mcp"
SERVICE_ACCOUNT="ga4-mcp-runner@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com analyticsadmin.googleapis.com analyticsdata.googleapis.com

gcloud iam service-accounts create ga4-mcp-runner \
  --display-name="GA4 MCP Cloud Run Runner" || true

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --service-account "$SERVICE_ACCOUNT" \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT="$PROJECT_ID"
```

After deployment, use the Cloud Run service URL with `/mcp` appended.

```text
https://SERVICE-xxxxx-REGION.a.run.app/mcp
```

## Security notes

- The upstream server is read-only, but analytics data can be sensitive.
- Do not commit credential JSON files.
- Prefer Cloud Run service identity and Google Analytics property-level Viewer access.
- For public ChatGPT connector usage, add OAuth or gateway authentication before production rollout.

## Smoke test

Use an MCP-compatible inspector or client and ask it to list accessible GA4 accounts and properties. If authentication is configured correctly, the server should return only resources visible to the runtime identity.
