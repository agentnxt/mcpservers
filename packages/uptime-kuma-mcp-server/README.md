# Uptime Kuma MCP Server

MCP server for [Uptime Kuma](https://uptime.kuma.pet/) — the self-hosted monitoring tool.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `UPTIME_KUMA_URL` | Yes | Base URL of your Uptime Kuma instance (e.g. `https://status.example.com`) |
| `UPTIME_KUMA_USERNAME` | Yes | Uptime Kuma username |
| `UPTIME_KUMA_PASSWORD` | Yes | Uptime Kuma password |

## Tools (19)

### Monitors
- **list_monitors** — List all monitors
- **get_monitor** — Get a monitor by ID
- **add_monitor** — Add a new monitor
- **edit_monitor** — Edit an existing monitor
- **delete_monitor** — Delete a monitor
- **pause_monitor** — Pause a monitor
- **resume_monitor** — Resume a paused monitor
- **get_monitor_beats** — Get heartbeat data for a monitor
- **get_monitor_uptime** — Get uptime percentage for a monitor
- **get_monitor_avg_ping** — Get average ping for a monitor

### Notifications
- **list_notifications** — List all notification providers
- **add_notification** — Add a notification provider
- **delete_notification** — Delete a notification provider

### Status Pages
- **list_status_pages** — List all status pages
- **get_status_page** — Get a status page by slug
- **add_status_page** — Add a new status page
- **delete_status_page** — Delete a status page

### System
- **get_info** — Get Uptime Kuma server info
- **list_tags** — List all tags

## Usage

```json
{
  "mcpServers": {
    "uptime-kuma": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "UPTIME_KUMA_URL": "https://status.example.com",
        "UPTIME_KUMA_USERNAME": "admin",
        "UPTIME_KUMA_PASSWORD": "your-password"
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
