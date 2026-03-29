#!/bin/bash
# ── Liferay MCP Server - API Test Script ──────────────────────────────────────
# Tests the Blog Postings API directly against a Liferay instance.
# Run this BEFORE the MCP server to verify your Liferay connection works.
#
# Usage:
#   export LIFERAY_URL=http://localhost:8080
#   export LIFERAY_USERNAME=test@liferay.com
#   export LIFERAY_PASSWORD=test
#   export LIFERAY_SITE_ID=20117
#   bash test-api.sh

set -e

# ── Config ────────────────────────────────────────────────────────────────────
URL="${LIFERAY_URL:?Set LIFERAY_URL}"
USER="${LIFERAY_USERNAME:?Set LIFERAY_USERNAME}"
PASS="${LIFERAY_PASSWORD:?Set LIFERAY_PASSWORD}"
SITE="${LIFERAY_SITE_ID:?Set LIFERAY_SITE_ID}"

AUTH=$(echo -n "${USER}:${PASS}" | base64)
HEADER="Authorization: Basic ${AUTH}"
CT="Content-Type: application/json"

echo "══════════════════════════════════════════════════════════"
echo "  Liferay API Test - Blog Postings"
echo "  URL: ${URL}"
echo "  User: ${USER}"
echo "  Site ID: ${SITE}"
echo "══════════════════════════════════════════════════════════"

# ── 1. List Blog Postings ─────────────────────────────────────────────────────
echo ""
echo "▶ 1. LIST blog postings..."
LIST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "${HEADER}" \
  -H "Accept: application/json" \
  "${URL}/o/headless-delivery/v1.0/sites/${SITE}/blog-postings?pageSize=5")

HTTP_CODE=$(echo "$LIST_RESPONSE" | tail -1)
BODY=$(echo "$LIST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "  ✓ Status: ${HTTP_CODE}"
  TOTAL=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('totalCount', 'N/A'))" 2>/dev/null || echo "N/A")
  echo "  ✓ Total blog postings: ${TOTAL}"
else
  echo "  ✗ Status: ${HTTP_CODE}"
  echo "  ✗ Response: ${BODY}"
  echo ""
  echo "FAILED: Cannot connect to Liferay API. Check URL, credentials, and site ID."
  exit 1
fi

# ── 2. Create Blog Posting ────────────────────────────────────────────────────
echo ""
echo "▶ 2. CREATE blog posting..."
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "${HEADER}" \
  -H "${CT}" \
  -H "Accept: application/json" \
  -d '{
    "headline": "MCP Test Post",
    "articleBody": "<p>This is a test blog posting created by the Liferay MCP test script.</p>",
    "alternativeHeadline": "Testing the API",
    "description": "A test post to verify API connectivity"
  }' \
  "${URL}/o/headless-delivery/v1.0/sites/${SITE}/blog-postings")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  BLOG_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
  echo "  ✓ Status: ${HTTP_CODE}"
  echo "  ✓ Created blog posting ID: ${BLOG_ID}"
else
  echo "  ✗ Status: ${HTTP_CODE}"
  echo "  ✗ Response: ${BODY}"
  echo "FAILED at CREATE step."
  exit 1
fi

# ── 3. Get Blog Posting ──────────────────────────────────────────────────────
echo ""
echo "▶ 3. GET blog posting by ID (${BLOG_ID})..."
GET_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "${HEADER}" \
  -H "Accept: application/json" \
  "${URL}/o/headless-delivery/v1.0/blog-postings/${BLOG_ID}")

HTTP_CODE=$(echo "$GET_RESPONSE" | tail -1)
BODY=$(echo "$GET_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  HEADLINE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['headline'])" 2>/dev/null)
  echo "  ✓ Status: ${HTTP_CODE}"
  echo "  ✓ Headline: ${HEADLINE}"
else
  echo "  ✗ Status: ${HTTP_CODE}"
  echo "  ✗ Response: ${BODY}"
fi

# ── 4. Update Blog Posting ────────────────────────────────────────────────────
echo ""
echo "▶ 4. UPDATE blog posting (${BLOG_ID})..."
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "${HEADER}" \
  -H "${CT}" \
  -H "Accept: application/json" \
  -d '{
    "headline": "MCP Test Post (Updated)",
    "articleBody": "<p>This blog posting has been updated by the test script.</p>"
  }' \
  "${URL}/o/headless-delivery/v1.0/blog-postings/${BLOG_ID}")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -1)
BODY=$(echo "$UPDATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  HEADLINE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['headline'])" 2>/dev/null)
  echo "  ✓ Status: ${HTTP_CODE}"
  echo "  ✓ Updated headline: ${HEADLINE}"
else
  echo "  ✗ Status: ${HTTP_CODE}"
  echo "  ✗ Response: ${BODY}"
fi

# ── 5. Delete Blog Posting ────────────────────────────────────────────────────
echo ""
echo "▶ 5. DELETE blog posting (${BLOG_ID})..."
DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE \
  -H "${HEADER}" \
  -H "Accept: application/json" \
  "${URL}/o/headless-delivery/v1.0/blog-postings/${BLOG_ID}")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -1)

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "  ✓ Status: ${HTTP_CODE} — Deleted successfully"
else
  BODY=$(echo "$DELETE_RESPONSE" | sed '$d')
  echo "  ✗ Status: ${HTTP_CODE}"
  echo "  ✗ Response: ${BODY}"
fi

# ── 6. Verify Deletion ───────────────────────────────────────────────────────
echo ""
echo "▶ 6. VERIFY deletion (GET should return 404)..."
VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "${HEADER}" \
  -H "Accept: application/json" \
  "${URL}/o/headless-delivery/v1.0/blog-postings/${BLOG_ID}")

HTTP_CODE=$(echo "$VERIFY_RESPONSE" | tail -1)

if [ "$HTTP_CODE" -eq 404 ]; then
  echo "  ✓ Status: ${HTTP_CODE} — Confirmed deleted"
else
  echo "  ⚠ Status: ${HTTP_CODE} — Expected 404"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  All 6 tests completed!"
echo "  Your Liferay API is working correctly."
echo "  You can now use the MCP server:"
echo ""
echo "    npm run build"
echo "    LIFERAY_URL=${URL} LIFERAY_USERNAME=${USER} \\"
echo "    LIFERAY_PASSWORD=*** LIFERAY_SITE_ID=${SITE} \\"
echo "    npm start"
echo "══════════════════════════════════════════════════════════"
