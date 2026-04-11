import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("LAGO_URL");
const apiKey = envRequired("LAGO_API_KEY");

const client = new HttpClient(baseUrl, {
  type: "bearer",
  token: apiKey,
});

const server = new McpServer({ name: "opensaasapps-lago", version: "1.0.0" });

function jsonResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

// --- Tools ---

server.tool(
  "lago_list_customers",
  "List all customers in Lago",
  {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of records per page"),
  },
  async ({ page, per_page }) => {
    try {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (per_page !== undefined) params.per_page = String(per_page);
      const result = await client.get("/api/v1/customers", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "lago_create_customer",
  "Create a new customer in Lago",
  {
    external_id: z.string().describe("Unique external identifier for the customer"),
    name: z.string().describe("Customer name"),
    email: z.string().optional().describe("Customer email address"),
    address_line1: z.string().optional().describe("Address line 1"),
    address_line2: z.string().optional().describe("Address line 2"),
    city: z.string().optional().describe("City"),
    state: z.string().optional().describe("State or region"),
    zipcode: z.string().optional().describe("Postal/zip code"),
    country: z.string().optional().describe("ISO 3166-1 alpha-2 country code"),
    currency: z.string().optional().describe("Currency code (e.g. USD, EUR)"),
    phone: z.string().optional().describe("Phone number"),
    tax_identification_number: z.string().optional().describe("Tax ID number"),
    timezone: z.string().optional().describe("IANA timezone (e.g. America/New_York)"),
  },
  async (args) => {
    try {
      const customer: Record<string, unknown> = {
        external_id: args.external_id,
        name: args.name,
      };
      if (args.email) customer.email = args.email;
      if (args.address_line1) customer.address_line1 = args.address_line1;
      if (args.address_line2) customer.address_line2 = args.address_line2;
      if (args.city) customer.city = args.city;
      if (args.state) customer.state = args.state;
      if (args.zipcode) customer.zipcode = args.zipcode;
      if (args.country) customer.country = args.country;
      if (args.currency) customer.currency = args.currency;
      if (args.phone) customer.phone = args.phone;
      if (args.tax_identification_number) customer.tax_identification_number = args.tax_identification_number;
      if (args.timezone) customer.timezone = args.timezone;
      const result = await client.post("/api/v1/customers", { customer });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "lago_list_subscriptions",
  "List subscriptions in Lago",
  {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of records per page"),
    external_customer_id: z.string().optional().describe("Filter by customer external ID"),
    plan_code: z.string().optional().describe("Filter by plan code"),
    status: z.array(z.string()).optional().describe("Filter by status (active, pending, terminated, canceled)"),
  },
  async ({ page, per_page, external_customer_id, plan_code, status }) => {
    try {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (per_page !== undefined) params.per_page = String(per_page);
      if (external_customer_id) params.external_customer_id = external_customer_id;
      if (plan_code) params.plan_code = plan_code;
      if (status && status.length > 0) params["status[]"] = status.join(",");
      const result = await client.get("/api/v1/subscriptions", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "lago_create_subscription",
  "Create a new subscription in Lago",
  {
    external_customer_id: z.string().describe("Customer external ID"),
    plan_code: z.string().describe("Plan code to subscribe to"),
    external_id: z.string().describe("Unique external ID for the subscription"),
    name: z.string().optional().describe("Display name for the subscription"),
    billing_time: z.string().optional().describe("Billing time: calendar or anniversary"),
    subscription_at: z.string().optional().describe("ISO 8601 subscription start date"),
  },
  async ({ external_customer_id, plan_code, external_id, name, billing_time, subscription_at }) => {
    try {
      const subscription: Record<string, unknown> = {
        external_customer_id,
        plan_code,
        external_id,
      };
      if (name) subscription.name = name;
      if (billing_time) subscription.billing_time = billing_time;
      if (subscription_at) subscription.subscription_at = subscription_at;
      const result = await client.post("/api/v1/subscriptions", { subscription });
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "lago_list_invoices",
  "List invoices in Lago",
  {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of records per page"),
    external_customer_id: z.string().optional().describe("Filter by customer external ID"),
    status: z.string().optional().describe("Filter by status (draft, finalized, voided)"),
    payment_status: z.string().optional().describe("Filter by payment status (pending, succeeded, failed)"),
    issuing_date_from: z.string().optional().describe("Filter invoices issued from this date (ISO 8601)"),
    issuing_date_to: z.string().optional().describe("Filter invoices issued up to this date (ISO 8601)"),
  },
  async ({ page, per_page, external_customer_id, status, payment_status, issuing_date_from, issuing_date_to }) => {
    try {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (per_page !== undefined) params.per_page = String(per_page);
      if (external_customer_id) params.external_customer_id = external_customer_id;
      if (status) params.status = status;
      if (payment_status) params.payment_status = payment_status;
      if (issuing_date_from) params.issuing_date_from = issuing_date_from;
      if (issuing_date_to) params.issuing_date_to = issuing_date_to;
      const result = await client.get("/api/v1/invoices", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

server.tool(
  "lago_list_plans",
  "List all billing plans in Lago",
  {
    page: z.number().optional().describe("Page number for pagination"),
    per_page: z.number().optional().describe("Number of records per page"),
  },
  async ({ page, per_page }) => {
    try {
      const params: Record<string, string> = {};
      if (page !== undefined) params.page = String(page);
      if (per_page !== undefined) params.per_page = String(per_page);
      const result = await client.get("/api/v1/plans", params);
      return jsonResult(result);
    } catch (e: any) {
      return jsonResult({ error: e.message });
    }
  }
);

// --- Start ---
const transport = new StdioServerTransport();
await server.connect(transport);
