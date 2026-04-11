# Lago MCP Server

MCP server for the [Lago](https://getlago.com/) open-source billing platform API.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `LAGO_URL` | Yes | Base URL of your Lago instance (e.g. `https://lago.example.com`) |
| `LAGO_API_KEY` | Yes | Lago API key for authentication |

## Tools (31)

### Customers
- **list_customers** — List all customers
- **get_customer** — Get a customer by external ID
- **create_customer** — Create a new customer
- **update_customer** — Update a customer
- **delete_customer** — Delete a customer
- **get_customer_portal_url** — Get the customer billing portal URL

### Events
- **create_event** — Create a usage event
- **create_batch_events** — Create multiple usage events at once
- **get_event** — Get an event by transaction ID

### Invoices
- **list_invoices** — List all invoices
- **get_invoice** — Get an invoice by ID
- **create_one_off_invoice** — Create a one-off invoice
- **update_invoice** — Update an invoice
- **download_invoice** — Download an invoice PDF
- **finalize_invoice** — Finalize a draft invoice
- **void_invoice** — Void an invoice

### Plans
- **list_plans** — List all plans
- **get_plan** — Get a plan by code
- **create_plan** — Create a new plan
- **update_plan** — Update a plan
- **delete_plan** — Delete a plan

### Subscriptions
- **list_subscriptions** — List all subscriptions
- **get_subscription** — Get a subscription by external ID
- **create_subscription** — Create a new subscription
- **update_subscription** — Update a subscription
- **terminate_subscription** — Terminate a subscription

### Wallets
- **list_wallets** — List all wallets
- **get_wallet** — Get a wallet by ID
- **create_wallet** — Create a new prepaid wallet
- **update_wallet** — Update a wallet
- **terminate_wallet** — Terminate a wallet

## Usage

```json
{
  "mcpServers": {
    "lago": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "LAGO_URL": "https://lago.example.com",
        "LAGO_API_KEY": "your-api-key"
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
