#!/usr/bin/env node

/**
 * Skills.sh → GitHub → Liferay Documents & Media Sync
 *
 * 1. Scrapes skill listings from skills.sh via browser extraction
 * 2. Downloads SKILL.md from each GitHub repo
 * 3. Uploads to Liferay AgentNXXT Documents & Media
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LIFERAY_URL = process.env.LIFERAY_URL || "http://51.75.251.56:8080";
const LIFERAY_USER = process.env.LIFERAY_USER || "test@liferay.com";
const LIFERAY_PASS = process.env.LIFERAY_PASS || "123456";
const SITE_ID = 32391; // AgentNXXT

const AUTH_HEADER = "Basic " + Buffer.from(`${LIFERAY_USER}:${LIFERAY_PASS}`).toString("base64");

// --- GitHub helpers ---
async function githubFetch(path) {
  const resp = await fetch(`https://api.github.com${path}`, {
    headers: {
      "Authorization": `token ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "skills-sync"
    }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub ${resp.status}: ${text.substring(0, 200)}`);
  }
  return resp.json();
}

async function getRawFile(owner, repo, path) {
  const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`, {
    headers: { "Authorization": `token ${GITHUB_TOKEN}` }
  });
  if (!resp.ok) {
    // Try master branch
    const resp2 = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`, {
      headers: { "Authorization": `token ${GITHUB_TOKEN}` }
    });
    if (!resp2.ok) return null;
    return resp2.text();
  }
  return resp.text();
}

// --- Liferay helpers ---
async function liferayFetch(path, options = {}) {
  const resp = await fetch(`${LIFERAY_URL}${path}`, {
    ...options,
    headers: {
      "Authorization": AUTH_HEADER,
      "Accept": "application/json",
      ...options.headers,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Liferay ${resp.status}: ${text.substring(0, 200)}`);
  }
  return resp.json();
}

async function getOrCreateFolder(parentFolderId, folderName) {
  // Search for existing folder
  try {
    const search = await liferayFetch(
      `/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders?filter=name eq '${encodeURIComponent(folderName)}'&parentDocumentFolderId=${parentFolderId}`
    );
    if (search.items && search.items.length > 0) {
      return search.items[0].id;
    }
  } catch (e) {
    // Folder search might fail, try creating
  }

  // Create folder
  try {
    const folder = await liferayFetch(
      `/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName,
          parentDocumentFolderId: parentFolderId || 0,
        }),
      }
    );
    return folder.id;
  } catch (e) {
    // If creation fails, try to find it again (race condition)
    const search = await liferayFetch(
      `/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders?filter=name eq '${encodeURIComponent(folderName)}'&parentDocumentFolderId=${parentFolderId}`
    );
    if (search.items && search.items.length > 0) {
      return search.items[0].id;
    }
    throw e;
  }
}

async function createFolderPath(parts) {
  let parentId = 0;
  for (const part of parts) {
    parentId = await getOrCreateFolder(parentId, part);
  }
  return parentId;
}

async function uploadFile(folderId, fileName, content) {
  const boundary = "----FormBoundary" + Math.random().toString(36).substring(2);
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
    "Content-Type: text/markdown",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const resp = await fetch(
    `${LIFERAY_URL}/o/headless-delivery/v1.0/document-folders/${folderId}/documents`,
    {
      method: "POST",
      headers: {
        "Authorization": AUTH_HEADER,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Accept": "application/json",
      },
      body,
    }
  );

  if (!resp.ok) {
    const text = await resp.text();
    // If file exists, skip
    if (text.includes("Duplicate") || text.includes("already exists")) {
      return { status: "exists" };
    }
    throw new Error(`Upload failed ${resp.status}: ${text.substring(0, 200)}`);
  }
  return resp.json();
}

// --- Skill discovery ---
async function discoverSkillRepos() {
  console.log("🔍 Searching GitHub for SKILL.md files...");

  const skills = [];
  let page = 1;

  while (skills.length < 1000 && page <= 10) {
    try {
      const data = await githubFetch(
        `/search/code?q=filename:SKILL.md+path:skills&per_page=100&page=${page}`
      );

      if (!data.items || data.items.length === 0) break;

      for (const item of data.items) {
        skills.push({
          owner: item.repository.owner.login,
          repo: item.repository.name,
          path: item.path,
          name: item.path.split("/").slice(-2, -1)[0] || item.name,
        });
      }

      console.log(`  Page ${page}: found ${data.items.length} (total: ${skills.length}/${data.total_count})`);
      page++;

      // Rate limit respect
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.error(`  Error on page ${page}: ${e.message}`);
      break;
    }
  }

  return skills;
}

// --- Main sync ---
async function main() {
  console.log("🚀 Skills.sh → Liferay Sync Starting\n");

  // Step 1: Discover skills
  const skills = await discoverSkillRepos();
  console.log(`\n📦 Found ${skills.length} skills to sync\n`);

  if (skills.length === 0) {
    console.log("No skills found. Exiting.");
    return;
  }

  // Step 2: Create root "Skills" folder in Liferay
  console.log("📁 Creating Skills folder structure in Liferay...");
  let rootFolderId;
  try {
    rootFolderId = await createFolderPath(["Skills"]);
    console.log(`  Root folder ID: ${rootFolderId}\n`);
  } catch (e) {
    console.error(`  Failed to create root folder: ${e.message}`);
    return;
  }

  // Step 3: Download and upload each skill
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const progress = `[${i + 1}/${skills.length}]`;

    try {
      // Download SKILL.md from GitHub
      const content = await getRawFile(skill.owner, skill.repo, skill.path);
      if (!content) {
        console.log(`${progress} ⏭  ${skill.owner}/${skill.repo}/${skill.name} - file not found`);
        skipped++;
        continue;
      }

      // Create folder path: Skills/{owner}/{repo}/{skill-name}
      const folderId = await createFolderPath(["Skills", skill.owner, skill.repo, skill.name]);

      // Upload SKILL.md
      const result = await uploadFile(folderId, "SKILL.md", content);
      if (result.status === "exists") {
        console.log(`${progress} ⏭  ${skill.owner}/${skill.repo}/${skill.name} - already exists`);
        skipped++;
      } else {
        console.log(`${progress} ✅ ${skill.owner}/${skill.repo}/${skill.name}`);
        success++;
      }
    } catch (e) {
      console.log(`${progress} ❌ ${skill.owner}/${skill.repo}/${skill.name} - ${e.message.substring(0, 80)}`);
      failed++;
    }

    // Rate limit: small delay between operations
    if (i % 10 === 0) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n📊 Sync Complete!`);
  console.log(`  ✅ Success: ${success}`);
  console.log(`  ⏭  Skipped: ${skipped}`);
  console.log(`  ❌ Failed:  ${failed}`);
  console.log(`  📦 Total:   ${skills.length}`);
}

main().catch(console.error);
