import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { HttpClient } from "../../../shared/src/http-client.js";
import { envRequired } from "../../../shared/src/env.js";

const baseUrl = envRequired("WOOCOMMERCE_URL");
const consumerKey = envRequired("WOO_CONSUMER_KEY");
const consumerSecret = envRequired("WOO_CONSUMER_SECRET");

const client = new HttpClient(baseUrl, {
  type: "basic",
  username: consumerKey,
  password: consumerSecret,
});

const server = new McpServer({
  name: "woocommerce",
  version: "1.0.0",
});

server.tool(
  "woo_list_products",
  "List WooCommerce products with optional filters",
  {
    page: z.number().optional().default(1).describe("Page number"),
    per_page: z.number().optional().default(20).describe("Products per page (max 100)"),
    search: z.string().optional().describe("Search term to filter products"),
    status: z
      .enum(["draft", "pending", "private", "publish", "any"])
      .optional()
      .describe("Filter by product status"),
    category: z.string().optional().describe("Filter by category ID"),
  },
  async ({ page, per_page, search, status, category }) => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: String(per_page),
    };
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) params.category = category;
    const result = await client.get("/wp-json/wc/v3/products", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "woo_get_product",
  "Get a single product by ID",
  {
    id: z.number().describe("Product ID"),
  },
  async ({ id }) => {
    const result = await client.get(`/wp-json/wc/v3/products/${id}`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "woo_create_product",
  "Create a new WooCommerce product",
  {
    name: z.string().describe("Product name"),
    type: z
      .enum(["simple", "grouped", "external", "variable"])
      .optional()
      .default("simple")
      .describe("Product type"),
    regular_price: z.string().optional().describe("Regular price as string (e.g. '29.99')"),
    description: z.string().optional().describe("Product description (HTML allowed)"),
    short_description: z.string().optional().describe("Short description"),
    sku: z.string().optional().describe("Stock keeping unit"),
    stock_quantity: z.number().optional().describe("Stock quantity"),
    categories: z
      .array(z.object({ id: z.number() }))
      .optional()
      .describe("Array of category objects with id"),
    images: z
      .array(z.object({ src: z.string() }))
      .optional()
      .describe("Array of image objects with src URL"),
    status: z
      .enum(["draft", "pending", "private", "publish"])
      .optional()
      .default("publish")
      .describe("Product status"),
  },
  async ({ name, type, regular_price, description, short_description, sku, stock_quantity, categories, images, status }) => {
    const body: Record<string, unknown> = { name, type, status };
    if (regular_price) body.regular_price = regular_price;
    if (description) body.description = description;
    if (short_description) body.short_description = short_description;
    if (sku) body.sku = sku;
    if (stock_quantity !== undefined) body.stock_quantity = stock_quantity;
    if (categories) body.categories = categories;
    if (images) body.images = images;
    const result = await client.post("/wp-json/wc/v3/products", body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "woo_list_orders",
  "List WooCommerce orders with optional filters",
  {
    page: z.number().optional().default(1).describe("Page number"),
    per_page: z.number().optional().default(20).describe("Orders per page (max 100)"),
    status: z
      .enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "trash", "any"])
      .optional()
      .describe("Filter by order status"),
    after: z.string().optional().describe("Limit to orders after this ISO 8601 date"),
    before: z.string().optional().describe("Limit to orders before this ISO 8601 date"),
  },
  async ({ page, per_page, status, after, before }) => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: String(per_page),
    };
    if (status) params.status = status;
    if (after) params.after = after;
    if (before) params.before = before;
    const result = await client.get("/wp-json/wc/v3/orders", params);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "woo_update_order",
  "Update an existing order (e.g. change status, add note)",
  {
    id: z.number().describe("Order ID"),
    status: z
      .enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"])
      .optional()
      .describe("New order status"),
    customer_note: z.string().optional().describe("Note to add for the customer"),
    meta_data: z
      .array(z.object({ key: z.string(), value: z.string() }))
      .optional()
      .describe("Array of metadata key-value pairs"),
  },
  async ({ id, status, customer_note, meta_data }) => {
    const body: Record<string, unknown> = {};
    if (status) body.status = status;
    if (customer_note) body.customer_note = customer_note;
    if (meta_data) body.meta_data = meta_data;
    const result = await client.put(`/wp-json/wc/v3/orders/${id}`, body);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }
);

server.tool(
  "woo_list_customers",
  "List WooCommerce customers with optional filters",
  {
    page: z.number().optional().default(1).describe("Page number"),
    per_page: z.number().optional().default(20).describe("Customers per page (max 100)"),
    search: z.string().optional().describe("Search term to filter customers"),
    role: z
      .enum(["all", "administrator", "editor", "author", "contributor", "subscriber", "customer"])
      .optional()
      .default("all")
      .describe("Filter by customer role"),
  },
  async ({ page, per_page, search, role }) => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: String(per_page),
    };
    if (search) params.search = search;
    if (role && role !== "all") params.role = role;
    const result = await client.get("/wp-json/wc/v3/customers", params);
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
