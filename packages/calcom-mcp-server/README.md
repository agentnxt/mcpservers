# Cal.com MCP Server

MCP server for the [Cal.com](https://cal.com/) scheduling platform API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CALCOM_URL` | Yes | Base URL of your Cal.com instance (e.g. `https://cal.com`) |
| `CALCOM_API_KEY` | Yes | Cal.com API key for authentication |

## Tools (24)

### Availabilities
- **list_availabilities** — List all availability schedules
- **get_availability** — Get availability by ID
- **create_availability** — Create a new availability schedule
- **update_availability** — Update an availability schedule

### Bookings
- **list_bookings** — List all bookings
- **get_booking** — Get a booking by ID
- **create_booking** — Create a new booking
- **cancel_booking** — Cancel a booking
- **reschedule_booking** — Reschedule a booking

### Event Types
- **list_event_types** — List all event types
- **get_event_type** — Get an event type by ID
- **create_event_type** — Create a new event type
- **update_event_type** — Update an event type
- **delete_event_type** — Delete an event type

### Schedules
- **list_schedules** — List all schedules
- **get_schedule** — Get a schedule by ID
- **create_schedule** — Create a new schedule
- **delete_schedule** — Delete a schedule

### Teams
- **list_teams** — List all teams
- **get_team** — Get a team by ID
- **create_team** — Create a new team
- **delete_team** — Delete a team

### Users & Webhooks
- **list_users** — List all users
- **list_webhooks** — List all webhooks
- **get_webhook** — Get a webhook by ID
- **create_webhook** — Create a new webhook
- **delete_webhook** — Delete a webhook
- **get_me** — Get the authenticated user profile

## Usage

```json
{
  "mcpServers": {
    "calcom": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "CALCOM_URL": "https://cal.com",
        "CALCOM_API_KEY": "your-api-key"
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
