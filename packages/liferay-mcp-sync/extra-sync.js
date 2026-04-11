#!/usr/bin/env node

/**
 * Extra AI Catalog Sync → Liferay AgentNXXT
 * Covers: Image Editors, Video Editing, Datasets, PDF Processing, Search
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LIFERAY_URL = process.env.LIFERAY_URL || "http://51.75.251.56:8080";
const LIFERAY_USER = process.env.LIFERAY_USER || "test@liferay.com";
const LIFERAY_PASS = process.env.LIFERAY_PASS || "123456";
const SITE_ID = 32391;
const AUTH_HEADER = "Basic " + Buffer.from(`${LIFERAY_USER}:${LIFERAY_PASS}`).toString("base64");

async function githubFetch(path) {
  const resp = await fetch(`https://api.github.com${path}`, {
    headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json", "User-Agent": "extra-sync" }
  });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
  return resp.json();
}

async function getRawFile(owner, repo, path) {
  for (const b of ["main", "master"]) {
    const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${b}/${path}`, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
    if (r.ok) return r.text();
  }
  return null;
}

const folderCache = new Map();
async function getOrCreateFolder(parentId, name) {
  const key = `${parentId}:${name}`;
  if (folderCache.has(key)) return folderCache.get(key);
  try {
    const s = await (await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders?filter=name eq '${encodeURIComponent(name)}'&parentDocumentFolderId=${parentId}`, { headers: { Authorization: AUTH_HEADER, Accept: "application/json" } })).json();
    if (s.items?.length) { folderCache.set(key, s.items[0].id); return s.items[0].id; }
  } catch {}
  const f = await (await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders`, { method: "POST", headers: { Authorization: AUTH_HEADER, Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ name, parentDocumentFolderId: parentId || 0 }) })).json();
  folderCache.set(key, f.id); return f.id;
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
  if (!r.ok) { const t = await r.text(); if (t.includes("Duplicate") || t.includes("already")) return { status: "exists" }; throw new Error(`Upload ${r.status}`); }
  return r.json();
}

async function syncRepoList(repos, folderName) {
  let total = 0;
  for (const fullName of repos) {
    const [owner, repo] = fullName.split("/");
    try {
      const info = await githubFetch(`/repos/${owner}/${repo}`);
      const readme = await getRawFile(owner, repo, "README.md");
      if (!readme) { console.log(`  ⏭  ${fullName} - no README`); continue; }

      const card = `# ${info.full_name}\n\n- **Stars:** ${info.stargazers_count.toLocaleString()}\n- **Language:** ${info.language || "N/A"}\n- **License:** ${info.license?.name || "N/A"}\n- **URL:** ${info.html_url}\n- **Description:** ${info.description || "N/A"}\n- **Topics:** ${(info.topics || []).join(", ")}\n- **Last Updated:** ${info.updated_at}\n\n---\n\n`;

      const folderId = await createFolderPath(["AI-Catalog", folderName, repo]);
      const r1 = await uploadFile(folderId, "INFO.md", card);
      console.log(`  ${r1.status === "exists" ? "⏭ " : "✅"} ${fullName} (⭐${info.stargazers_count.toLocaleString()})`);
      total++;

      const r2 = await uploadFile(folderId, "README.md", readme);
      total++;
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ❌ ${fullName}: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`\n  📊 ${folderName}: ${total} files\n`);
  return total;
}

// === CATEGORIES ===

const CATEGORIES = {
  "Image-Editors": [
    "nicbarker/clay", "nicbarker/clay", // placeholder removed
    "nicbarker/clay",
    // Actual image editor repos:
    "nicbarker/clay",
  ],
  "Video-Editing": [],
  "Datasets": [],
  "PDF-Processing": [],
  "Search-Engines": [],
};

// Let me use GitHub search to find the best repos per category
async function discoverAndSync(category, query, count = 20) {
  console.log(`\n📂 === ${category} ===\n`);
  try {
    const data = await githubFetch(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${count}`);
    const repos = (data.items || []).map(r => `${r.owner.login}/${r.name}`);
    return await syncRepoList(repos, category);
  } catch (e) {
    console.log(`  ❌ Search failed: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log("🚀 Extra AI Catalog Sync → Liferay AgentNXXT\n");

  // Test connection
  try {
    const r = await fetch(`${LIFERAY_URL}/o/headless-admin-user/v1.0/my-user-account`, { headers: { Authorization: AUTH_HEADER, Accept: "application/json" } });
    if (!r.ok) throw new Error(`${r.status}`);
    console.log("✅ Liferay OK\n");
  } catch (e) { console.error("❌ Liferay down:", e.message); return; }

  const results = {};

  results["Image-Editors"] = await discoverAndSync("Image-Editors",
    "open source image editor photo editor canvas drawing tool", 20);

  results["Video-Editing"] = await discoverAndSync("Video-Editing",
    "open source video editor video editing tool NLE timeline", 20);

  results["Datasets"] = await discoverAndSync("Datasets",
    "open source dataset tools data labeling annotation dataset management", 20);

  results["PDF-Processing"] = await discoverAndSync("PDF-Processing",
    "open source pdf processing pdf parser pdf generator pdf editor", 20);

  results["Search-Engines"] = await discoverAndSync("Search-Engines",
    "open source search engine full text search vector search semantic search", 20);

  results["AI-Music"] = await discoverAndSync("AI-Music",
    "open source ai music generation audio generation music ai", 15);

  results["AI-3D"] = await discoverAndSync("AI-3D",
    "open source 3d generation ai 3d model text to 3d nerf gaussian", 15);

  results["AI-Code"] = await discoverAndSync("AI-Code",
    "open source ai code assistant code generation copilot alternative", 15);

  results["RAG"] = await discoverAndSync("RAG",
    "retrieval augmented generation RAG knowledge base document qa", 20);

  results["MLOps"] = await discoverAndSync("MLOps",
    "mlops machine learning operations model serving model deployment", 15);

  results["Data-Pipelines"] = await discoverAndSync("Data-Pipelines",
    "open source data pipeline ETL data integration data orchestration", 15);

  results["No-Code-Low-Code"] = await discoverAndSync("No-Code-Low-Code",
    "open source no code low code workflow automation builder", 15);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 EXTRA SYNC COMPLETE\n");
  let grandTotal = 0;
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v} files`);
    grandTotal += v;
  }
  console.log(`\n  Grand Total: ${grandTotal} files`);
}

main().catch(console.error);
