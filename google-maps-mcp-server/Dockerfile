# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY tsconfig.json ./
COPY . ./

# Create standalone tsconfig (the original extends from root tsconfig.json)
RUN echo '{"compilerOptions":{"outDir":"./dist","rootDir":".","moduleResolution":"NodeNext","module":"NodeNext"}}' > tsconfig.build.json

RUN npx tsc -p tsconfig.build.json

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL org.opencontainers.image.title="google-maps-mcp-server"
LABEL org.opencontainers.image.description="MCP server"
LABEL org.opencontainers.image.source="https://github.com/agentnxt/mcpservers"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER mcp

ENTRYPOINT ["node", "dist/index.js"]
