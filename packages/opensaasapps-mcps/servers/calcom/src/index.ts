import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("CALCOM_URL");
const apiKey = envRequired("CALCOM_API_KEY");

const client = new HttpClient(baseUrl, {
  type: "query",
  params: { apiKey },
});

const server = new McpServer({
  name: "calcom",
  version: "1.0.0",
});

server.tool(
  "calcom_list_event_types",
  "List all event types configured in Cal.com",
  {},
  async () => {
    const result = await client.get("/api/v1/event-types");
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "calcom_list_bookings",
  "List bookings, optionally filtered by status",
  {
    status: z
      .enum(["upcoming", "recurring", "past", "cancelled", "unconfirmed"])
      .optional()
      .describe("Filter bookings by status"),
  },
  async ({ status }) => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const result = await client.get("/api/v1/bookings", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "calcom_create_booking",
  "Create a new booking",
  {
    eventTypeId: z.number().describe("Event type ID to book"),
    start: z.string().describe("Start datetime in ISO 8601 format"),
    end: z.string().describe("End datetime in ISO 8601 format"),
    name: z.string().describe("Attendee full name"),
    email: z.string().describe("Attendee email address"),
    timeZone: z.string().optional().default("UTC").describe("Attendee timezone"),
    notes: z.string().optional().describe("Additional booking notes"),
  },
  async ({ eventTypeId, start, end, name, email, timeZone, notes }) => {
    const body: Record<string, unknown> = {
      eventTypeId,
      start,
      end,
      responses: {
        name,
        email,
      },
      timeZone,
      language: "en",
      metadata: {},
    };
    if (notes) body.notes = notes;
    const result = await client.post("/api/v1/bookings", body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "calcom_cancel_booking",
  "Cancel an existing booking",
  {
    id: z.number().describe("Booking ID to cancel"),
    reason: z.string().optional().describe("Cancellation reason"),
  },
  async ({ id, reason }) => {
    const result = await client.delete(
      `/api/v1/bookings/${id}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`
    );
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "calcom_get_availability",
  "Check availability for an event type within a date range",
  {
    eventTypeId: z.number().describe("Event type ID"),
    dateFrom: z.string().describe("Start date in ISO 8601 format (e.g. 2024-01-01)"),
    dateTo: z.string().describe("End date in ISO 8601 format (e.g. 2024-01-31)"),
  },
  async ({ eventTypeId, dateFrom, dateTo }) => {
    const result = await client.get("/api/v1/availability", {
      eventTypeId: String(eventTypeId),
      dateFrom,
      dateTo,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
