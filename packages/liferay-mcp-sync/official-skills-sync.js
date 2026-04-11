#!/usr/bin/env node

/**
 * Official Skills + Local Skills → Liferay AgentNXXT
 * Only syncs skills from verified orgs on skills.sh/official
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LIFERAY_URL = process.env.LIFERAY_URL || "http://51.75.251.56:8080";
const LIFERAY_USER = process.env.LIFERAY_USER || "test@liferay.com";
const LIFERAY_PASS = process.env.LIFERAY_PASS || "123456";
const SITE_ID = 32391;
const AUTH_HEADER = "Basic " + Buffer.from(`${LIFERAY_USER}:${LIFERAY_PASS}`).toString("base64");

import { readdir, readFile } from "fs/promises";
import { join } from "path";

// 79 official orgs from skills.sh/official
const OFFICIAL_ORGS = [
  "anthropics","apify","apollographql","auth0","automattic","axiomhq","base",
  "better-auth","bitwarden","box","brave","browser-use","browserbase",
  "callstackincubator","clerk","clickhouse","cloudflare","coderabbitai",
  "coinbase","dagster-io","datadog-labs","dbt-labs","denoland","elevenlabs",
  "encoredev","expo","facebook","figma","firebase","firecrawl","flutter",
  "getsentry","github","google-gemini","google-labs-code","hashicorp",
  "huggingface","kotlin","langchain-ai","langfuse","launchdarkly","livekit",
  "makenotion","mapbox","mastra-ai","mcp-use","medusajs","microsoft","n8n-io",
  "neondatabase","nuxt","openai","openshift","planetscale","posthog","prisma",
  "pulumi","pytorch","redis","remotion-dev","resend","rivet-dev","runwayml",
  "sanity-io","semgrep","streamlit","stripe","supabase","sveltejs","tavily-ai",
  "tinybirdco","tldraw","triggerdotdev","upstash","vercel","vercel-labs",
  "webflow","wix","wordpress"
];

// --- GitHub ---
async function githubFetch(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "User-Agent": "official-sync" }
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

async function getRawFile(owner, repo, path) {
  for (const b of ["main", "master"]) {
    const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${b}/${path}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    if (r.ok) return r.text();
  }
  return null;
}

// --- Liferay ---
const folderCache = new Map();
async function getOrCreateFolder(parentId, name) {
  const key = `${parentId}:${name}`;
  if (folderCache.has(key)) return folderCache.get(key);
  try {
    const s = await (await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders?filter=name eq '${encodeURIComponent(name)}'&parentDocumentFolderId=${parentId}`, {
      headers: { Authorization: AUTH_HEADER, Accept: "application/json" }
    })).json();
    if (s.items?.length) { folderCache.set(key, s.items[0].id); return s.items[0].id; }
  } catch {}
  const f = await (await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders`, {
    method: "POST", headers: { Authorization: AUTH_HEADER, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentDocumentFolderId: parentId || 0 })
  })).json();
  folderCache.set(key, f.id);
  return f.id;
}

async function createFolderPath(parts) {
  let id = 0; for (const p of parts) id = await getOrCreateFolder(id, p); return id;
}

async function uploadFile(folderId, fileName, content, mime = "text/markdown") {
  const b = "----FB" + Math.random().toString(36).substring(2);
  const body = `--${b}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n${content}\r\n--${b}--`;
  const r = await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/document-folders/${folderId}/documents`, {
    method: "POST", headers: { Authorization: AUTH_HEADER, "Content-Type": `multipart/form-data; boundary=${b}`, Accept: "application/json" }, body
  });
  if (!r.ok) {
    const t = await r.text();
    if (t.includes("Duplicate") || t.includes("already")) return { status: "exists" };
    throw new Error(`Upload ${r.status}`);
  }
  return r.json();
}

// --- Sync official GitHub skills ---
async function syncOfficialSkills() {
  console.log("📦 === OFFICIAL GITHUB SKILLS ===\n");

  let total = 0, created = 0, skipped = 0, failed = 0;

  for (let i = 0; i < OFFICIAL_ORGS.length; i++) {
    const org = OFFICIAL_ORGS[i];
    console.log(`\n[${i + 1}/${OFFICIAL_ORGS.length}] 🏢 ${org}`);

    try {
      const data = await githubFetch(`/search/code?q=filename:SKILL.md+org:${org}&per_page=100`);
      const items = data.items || [];

      if (items.length === 0) {
        console.log("  (no skills found)");
        continue;
      }

      console.log(`  Found ${data.total_count} skills`);

      for (const item of items) {
        const owner = item.repository.owner.login;
        const repo = item.repository.name;
        const skillName = item.path.split("/").slice(-2, -1)[0] || item.name.replace(".md", "");

        try {
          const content = await getRawFile(owner, repo, item.path);
          if (!content) { skipped++; continue; }

          const folderId = await createFolderPath(["Skills", "Official", org, repo, skillName]);
          const result = await uploadFile(folderId, "SKILL.md", content);

          if (result.status === "exists") {
            skipped++;
          } else {
            console.log(`  ✅ ${repo}/${skillName}`);
            created++;
          }
          total++;
        } catch (e) {
          console.log(`  ❌ ${repo}/${skillName}: ${e.message.substring(0, 50)}`);
          failed++;
          total++;
        }
      }

      // Rate limit: pause between orgs
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.log(`  ❌ Search failed: ${e.message.substring(0, 60)}`);
      // If rate limited, wait longer
      if (e.message.includes("403")) {
        console.log("  ⏳ Rate limited, waiting 60s...");
        await new Promise(r => setTimeout(r, 60000));
      }
    }
  }

  return { total, created, skipped, failed };
}

// --- Sync local skills ---
async function syncLocalSkills() {
  console.log("\n\n💻 === LOCAL SKILLS ===\n");

  const localSkillDirs = [
    "/Users/apple/.claude/skills",
    "/Users/apple/.claude/plugins/cache",
    "/Users/apple/.claude/plugins/marketplaces"
  ];

  let total = 0, created = 0, skipped = 0, failed = 0;

  async function findSkillFiles(dir, depth = 0) {
    if (depth > 6) return [];
    const files = [];
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...await findSkillFiles(fullPath, depth + 1));
        } else if (entry.name === "SKILL.md") {
          files.push(fullPath);
        }
      }
    } catch {}
    return files;
  }

  for (const baseDir of localSkillDirs) {
    const skillFiles = await findSkillFiles(baseDir);
    console.log(`  📂 ${baseDir}: ${skillFiles.length} skills`);

    for (const filePath of skillFiles) {
      try {
        const content = await readFile(filePath, "utf-8");
        // Extract skill name from path
        const parts = filePath.replace(baseDir + "/", "").split("/");
        const skillName = parts[parts.length - 2] || parts[0];
        const source = parts.slice(0, -1).join("/");

        const folderId = await createFolderPath(["Skills", "Local", ...parts.slice(0, -1)]);
        const result = await uploadFile(folderId, "SKILL.md", content);

        if (result.status === "exists") {
          skipped++;
        } else {
          console.log(`  ✅ ${source}`);
          created++;
        }
        total++;
      } catch (e) {
        console.log(`  ❌ ${filePath}: ${e.message.substring(0, 50)}`);
        failed++;
        total++;
      }
    }
  }

  return { total, created, skipped, failed };
}

// --- Main ---
async function main() {
  console.log("🚀 Official + Local Skills → Liferay AgentNXXT");
  console.log("=".repeat(50) + "\n");

  // Test Liferay
  try {
    const r = await fetch(`${LIFERAY_URL}/o/headless-admin-user/v1.0/my-user-account`, {
      headers: { Authorization: AUTH_HEADER, Accept: "application/json" }
    });
    if (!r.ok) throw new Error(`${r.status}`);
    console.log("✅ Liferay OK\n");
  } catch (e) { console.error("❌ Liferay down:", e.message); return; }

  const official = await syncOfficialSkills();
  const local = await syncLocalSkills();

  console.log("\n" + "=".repeat(50));
  console.log("📊 SYNC COMPLETE\n");
  console.log("  Official Skills:");
  console.log(`    ✅ Created: ${official.created}`);
  console.log(`    ⏭  Skipped: ${official.skipped}`);
  console.log(`    ❌ Failed:  ${official.failed}`);
  console.log(`    📦 Total:   ${official.total}`);
  console.log("\n  Local Skills:");
  console.log(`    ✅ Created: ${local.created}`);
  console.log(`    ⏭  Skipped: ${local.skipped}`);
  console.log(`    ❌ Failed:  ${local.failed}`);
  console.log(`    📦 Total:   ${local.total}`);
  console.log(`\n  Grand Total: ${official.total + local.total} skills`);
}

main().catch(console.error);
