# Matomo MCP Server

MCP server for the [Matomo](https://matomo.org/) web analytics platform API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MATOMO_URL` | Yes | Base URL of your Matomo instance (e.g. `https://matomo.example.com`) |
| `MATOMO_TOKEN` | Yes | Matomo API authentication token |
| `MATOMO_SITE_ID` | No | Default site ID (used when not specified per-request) |

## Tools (30)

### Page Analytics
- **get_page_urls** — Get page URL visit statistics
- **get_page_titles** — Get page title visit statistics
- **get_downloads** — Get file download statistics
- **get_outlinks** — Get outbound link statistics
- **get_site_search_keywords** — Get internal search keywords

### Visitors
- **get_visits_summary** — Get visits summary for a period
- **get_visits_over_time** — Get visits over time
- **get_visit_count** — Get total visit count
- **get_live_visits** — Get live visitor data
- **get_visitor_profile** — Get a visitor's profile

### Devices & Technology
- **get_device_types** — Get device type breakdown
- **get_browsers** — Get browser usage statistics
- **get_os** — Get operating system statistics

### Goals
- **get_goals** — List all goals
- **get_goal** — Get a specific goal
- **add_goal** — Create a new goal
- **get_goal_conversions** — Get goal conversion data

### Referrers
- **get_referrer_types** — Get referrer type breakdown
- **get_all_referrers** — Get all referrer data
- **get_search_engines** — Get search engine referrer stats
- **get_keywords** — Get search keyword stats
- **get_websites** — Get referring website stats

### Sites & Users
- **list_sites** — List all sites
- **get_site** — Get site details
- **add_site** — Add a new site
- **get_site_settings** — Get site settings
- **list_users** — List all users
- **get_user** — Get a user by login
- **add_user** — Add a new user
- **set_user_access** — Set user access permissions

### Advanced
- **get_row_evolution** — Get row evolution data for any report
- **call_api_method** — Call any Matomo API method directly

## Usage

```json
{
  "mcpServers": {
    "matomo": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "MATOMO_URL": "https://matomo.example.com",
        "MATOMO_TOKEN": "your-api-token",
        "MATOMO_SITE_ID": "1"
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
