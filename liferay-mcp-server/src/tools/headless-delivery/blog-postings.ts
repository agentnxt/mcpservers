import type { Tool } from "../../types.js";

export const tools: Tool[] = [
  // ── List Blog Postings ──────────────────────────────────────────────────────
  {
    name: "list_blog_postings",
    api: "headless-delivery",
    description:
      "List blog postings for a Liferay site. Supports pagination, search, OData filtering, sorting, and field selection.",
    inputSchema: {
      type: "object",
      properties: {
        siteId: {
          type: "string",
          description:
            "Site ID. Uses LIFERAY_SITE_ID env var if omitted.",
        },
        page: {
          type: "number",
          description: "Page number (default 1)",
        },
        pageSize: {
          type: "number",
          description: "Results per page (default 20, max 100)",
        },
        search: {
          type: "string",
          description: "Search keywords",
        },
        filter: {
          type: "string",
          description:
            'OData filter expression, e.g. "dateCreated gt 2024-01-01"',
        },
        sort: {
          type: "string",
          description: 'Sort field and order, e.g. "dateCreated:desc"',
        },
        fields: {
          type: "string",
          description: "Comma-separated fields to return",
        },
        flatten: {
          type: "string",
          description: "Flatten nested objects in response",
        },
      },
    },
    handler: async (client, args) => {
      const { siteId, ...params } = args as Record<string, string>;
      const resolvedSiteId = siteId || process.env.LIFERAY_SITE_ID;
      if (!resolvedSiteId) {
        throw new Error(
          "siteId is required — pass it as an argument or set LIFERAY_SITE_ID env var"
        );
      }
      return client.get(
        `/o/headless-delivery/v1.0/sites/${resolvedSiteId}/blog-postings`,
        params
      );
    },
  },

  // ── Get Blog Posting ────────────────────────────────────────────────────────
  {
    name: "get_blog_posting",
    api: "headless-delivery",
    description: "Get a single blog posting by its ID.",
    inputSchema: {
      type: "object",
      required: ["blogPostingId"],
      properties: {
        blogPostingId: {
          type: "string",
          description: "The blog posting ID",
        },
        fields: {
          type: "string",
          description: "Comma-separated fields to return",
        },
      },
    },
    handler: async (client, args) => {
      const { blogPostingId, ...params } = args as Record<string, string>;
      return client.get(
        `/o/headless-delivery/v1.0/blog-postings/${blogPostingId}`,
        params
      );
    },
  },

  // ── Create Blog Posting ─────────────────────────────────────────────────────
  {
    name: "create_blog_posting",
    api: "headless-delivery",
    description:
      "Create a new blog posting on a Liferay site.",
    inputSchema: {
      type: "object",
      required: ["headline", "articleBody"],
      properties: {
        siteId: {
          type: "string",
          description:
            "Site ID. Uses LIFERAY_SITE_ID env var if omitted.",
        },
        headline: {
          type: "string",
          description: "Blog post title/headline",
        },
        articleBody: {
          type: "string",
          description: "HTML content body",
        },
        alternativeHeadline: {
          type: "string",
          description: "Subtitle",
        },
        description: {
          type: "string",
          description: "Short description/excerpt",
        },
        friendlyUrlPath: {
          type: "string",
          description: "URL-friendly slug",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Tags/keywords",
        },
        taxonomyCategoryIds: {
          type: "array",
          items: { type: "number" },
          description: "Category IDs to associate",
        },
      },
    },
    handler: async (client, args) => {
      const { siteId, ...body } = args as Record<string, unknown>;
      const resolvedSiteId =
        (siteId as string) || process.env.LIFERAY_SITE_ID;
      if (!resolvedSiteId) {
        throw new Error(
          "siteId is required — pass it as an argument or set LIFERAY_SITE_ID env var"
        );
      }
      return client.post(
        `/o/headless-delivery/v1.0/sites/${resolvedSiteId}/blog-postings`,
        body
      );
    },
  },

  // ── Update Blog Posting ─────────────────────────────────────────────────────
  {
    name: "update_blog_posting",
    api: "headless-delivery",
    description:
      "Update an existing blog posting by ID. Uses PUT (full replacement).",
    inputSchema: {
      type: "object",
      required: ["blogPostingId"],
      properties: {
        blogPostingId: {
          type: "string",
          description: "Blog posting ID to update",
        },
        headline: {
          type: "string",
          description: "Blog post title/headline",
        },
        articleBody: {
          type: "string",
          description: "HTML content body",
        },
        alternativeHeadline: {
          type: "string",
          description: "Subtitle",
        },
        description: {
          type: "string",
          description: "Short description/excerpt",
        },
        friendlyUrlPath: {
          type: "string",
          description: "URL-friendly slug",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Tags/keywords",
        },
        taxonomyCategoryIds: {
          type: "array",
          items: { type: "number" },
          description: "Category IDs to associate",
        },
      },
    },
    handler: async (client, args) => {
      const { blogPostingId, ...body } = args as Record<string, unknown>;
      return client.put(
        `/o/headless-delivery/v1.0/blog-postings/${blogPostingId}`,
        body
      );
    },
  },

  // ── Delete Blog Posting ─────────────────────────────────────────────────────
  {
    name: "delete_blog_posting",
    api: "headless-delivery",
    description: "Delete a blog posting by ID.",
    inputSchema: {
      type: "object",
      required: ["blogPostingId"],
      properties: {
        blogPostingId: {
          type: "string",
          description: "The blog posting ID to delete",
        },
      },
    },
    handler: async (client, args) => {
      const { blogPostingId } = args as Record<string, string>;
      return client.delete(
        `/o/headless-delivery/v1.0/blog-postings/${blogPostingId}`
      );
    },
  },
];
