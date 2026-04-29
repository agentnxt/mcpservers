# Docker Hub Secrets Setup

The Docker publish workflows in this repository require the following GitHub Actions secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`

## Where To Configure

GitHub repository:
- `agnxxt/mcp-registry`

GitHub path:
- Settings
- Secrets and variables
- Actions
- New repository secret

## Required Values

- `DOCKER_USERNAME`: the Docker Hub namespace or username that should own the published images
- `DOCKER_PASSWORD`: a Docker Hub access token or password with permission to push images

## Workflows That Depend On These Secrets

- `.github/workflows/docker-push.yml`
- `.github/workflows/unboxd-platform-mcp.yml`

## Expected Result After Setup

Once both secrets are present:
- pushes to `main` can build and publish Docker images
- the Unboxd platform MCP server images can be published automatically
