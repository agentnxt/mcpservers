FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PORT=8080

RUN pip install --no-cache-dir \
    analytics-mcp \
    mcp-proxy

WORKDIR /app

RUN addgroup --system mcp && adduser --system --ingroup mcp mcp
USER mcp

EXPOSE 8080

CMD ["sh", "-c", "mcp-proxy --host 0.0.0.0 --port ${PORT} --transport streamable-http -- analytics-mcp"]
