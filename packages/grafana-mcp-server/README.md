# Grafana MCP Server

MCP server for the [Grafana](https://grafana.com/) observability platform API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GRAFANA_URL` | Yes | Base URL of your Grafana instance (e.g. `https://grafana.example.com`) |
| `GRAFANA_API_KEY` | Yes | Grafana API key or service account token |

## Tools (34)

### Dashboards
- **search_dashboards** — Search dashboards by query
- **get_dashboard** — Get a dashboard by UID
- **create_dashboard** — Create a new dashboard
- **delete_dashboard** — Delete a dashboard by UID
- **get_dashboard_versions** — Get dashboard version history
- **get_dashboard_permissions** — Get dashboard permissions
- **update_dashboard_permissions** — Update dashboard permissions
- **get_home_dashboard** — Get the home dashboard

### Data Sources
- **list_datasources** — List all data sources
- **get_datasource** — Get a data source by ID
- **get_datasource_by_name** — Get a data source by name
- **create_datasource** — Create a new data source
- **update_datasource** — Update a data source
- **delete_datasource** — Delete a data source

### Alerting
- **list_alert_rules** — List all alert rules
- **get_alert_rule** — Get an alert rule by UID
- **create_alert_rule** — Create a new alert rule
- **update_alert_rule** — Update an alert rule
- **delete_alert_rule** — Delete an alert rule
- **list_alert_notifications** — List alert notification channels

### Folders
- **list_folders** — List all folders
- **get_folder** — Get a folder by UID
- **create_folder** — Create a new folder
- **update_folder** — Update a folder
- **delete_folder** — Delete a folder

### Organizations
- **list_orgs** — List all organizations
- **get_org** — Get an organization by ID
- **create_org** — Create a new organization
- **get_current_org** — Get the current organization

### Users
- **list_users** — List all users
- **get_user** — Get a user by ID
- **search_users** — Search users by query
- **update_user** — Update a user
- **get_current_user** — Get the authenticated user

## Usage

```json
{
  "mcpServers": {
    "grafana": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GRAFANA_URL": "https://grafana.example.com",
        "GRAFANA_API_KEY": "your-api-key"
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
