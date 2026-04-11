#!/usr/bin/env node

/**
 * Master AI Catalog Sync → Liferay AgentNXXT
 *
 * Syncs from multiple sources:
 * 1. Prompts (awesome-chatgpt-prompts, claude prompts, system prompts, GPT store prompts)
 * 2. CrewAI templates
 * 3. Langflow templates
 * 4. LLM catalog (Hugging Face open-source models)
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
      "User-Agent": "master-sync"
    }
  });
  if (!resp.ok) throw new Error(`GitHub ${resp.status}`);
  return resp.json();
}

async function getRawFile(owner, repo, path, branch = "main") {
  for (const b of [branch, "master"]) {
    const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${b}/${path}`, {
      headers: { "Authorization": `token ${GITHUB_TOKEN}` }
    });
    if (resp.ok) return resp.text();
  }
  return null;
}

async function getRepoContents(owner, repo, path = "") {
  try {
    return await githubFetch(`/repos/${owner}/${repo}/contents/${path}`);
  } catch { return []; }
}

// --- Liferay helpers ---
async function liferayFetch(path, options = {}) {
  const resp = await fetch(`${LIFERAY_URL}${path}`, {
    ...options,
    headers: { "Authorization": AUTH_HEADER, "Accept": "application/json", ...options.headers },
  });
  if (!resp.ok) throw new Error(`Liferay ${resp.status}`);
  return resp.json();
}

const folderCache = new Map();

async function getOrCreateFolder(parentId, name) {
  const key = `${parentId}:${name}`;
  if (folderCache.has(key)) return folderCache.get(key);

  try {
    const search = await liferayFetch(
      `/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders?filter=name eq '${encodeURIComponent(name)}'&parentDocumentFolderId=${parentId}`
    );
    if (search.items?.length > 0) {
      folderCache.set(key, search.items[0].id);
      return search.items[0].id;
    }
  } catch {}

  const folder = await liferayFetch(
    `/o/headless-delivery/v1.0/sites/${SITE_ID}/document-folders`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentDocumentFolderId: parentId || 0 }) }
  );
  folderCache.set(key, folder.id);
  return folder.id;
}

async function createFolderPath(parts) {
  let id = 0;
  for (const p of parts) { id = await getOrCreateFolder(id, p); }
  return id;
}

async function uploadFile(folderId, fileName, content, mimeType = "text/markdown") {
  const boundary = "----FB" + Math.random().toString(36).substring(2);
  const body = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;

  const resp = await fetch(`${LIFERAY_URL}/o/headless-delivery/v1.0/document-folders/${folderId}/documents`, {
    method: "POST",
    headers: { "Authorization": AUTH_HEADER, "Content-Type": `multipart/form-data; boundary=${boundary}`, "Accept": "application/json" },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text();
    if (text.includes("Duplicate") || text.includes("already exists")) return { status: "exists" };
    throw new Error(`Upload ${resp.status}: ${text.substring(0, 100)}`);
  }
  return resp.json();
}

// --- Source: Prompts ---
async function syncPrompts() {
  console.log("\n📝 === SYNCING PROMPTS ===\n");

  const sources = [
    { owner: "f", repo: "prompts.chat", label: "awesome-chatgpt-prompts" },
    { owner: "langgptai", repo: "awesome-claude-prompts", label: "awesome-claude-prompts" },
    { owner: "dontriskit", repo: "awesome-ai-system-prompts", label: "ai-system-prompts" },
    { owner: "ai-boost", repo: "awesome-prompts", label: "gpt-store-prompts" },
    { owner: "promptslab", repo: "Awesome-Prompt-Engineering", label: "prompt-engineering" },
  ];

  let total = 0;
  for (const src of sources) {
    console.log(`\n  📂 ${src.label} (${src.owner}/${src.repo})`);

    try {
      // Download README.md which typically contains all prompts
      const readme = await getRawFile(src.owner, src.repo, "README.md");
      if (!readme) { console.log("    ⏭  README not found"); continue; }

      const folderId = await createFolderPath(["AI-Catalog", "Prompts", src.label]);
      const result = await uploadFile(folderId, "README.md", readme);
      console.log(`    ${result.status === "exists" ? "⏭  exists" : "✅ uploaded"} README.md (${(readme.length / 1024).toFixed(1)}KB)`);
      total++;

      // Also grab any other .md files in the repo root and prompts/ folder
      for (const dir of ["", "prompts", "src", "data"]) {
        try {
          const contents = await getRepoContents(src.owner, src.repo, dir);
          if (!Array.isArray(contents)) continue;
          const mdFiles = contents.filter(f => f.name.endsWith(".md") && f.name !== "README.md" && f.size < 100000);

          for (const file of mdFiles.slice(0, 50)) {
            const content = await getRawFile(src.owner, src.repo, file.path);
            if (!content) continue;
            const subFolder = dir ? await createFolderPath(["AI-Catalog", "Prompts", src.label, dir]) : folderId;
            const res = await uploadFile(subFolder, file.name, content);
            console.log(`    ${res.status === "exists" ? "⏭ " : "✅"} ${file.path}`);
            total++;
          }
        } catch {}
      }

      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log(`    ❌ Error: ${e.message.substring(0, 80)}`);
    }
  }
  console.log(`\n  📊 Prompts synced: ${total}`);
  return total;
}

// --- Source: CrewAI ---
async function syncCrewAI() {
  console.log("\n🚢 === SYNCING CREWAI TEMPLATES ===\n");

  let total = 0;
  for (const dir of ["crews", "flows"]) {
    const contents = await getRepoContents("crewAIInc", "crewAI-examples", dir);
    if (!Array.isArray(contents)) continue;

    const templates = contents.filter(c => c.type === "dir");
    console.log(`  📂 ${dir}: ${templates.length} templates`);

    for (const tmpl of templates) {
      try {
        const folderId = await createFolderPath(["AI-Catalog", "CrewAI", dir, tmpl.name]);

        // Get README and main files
        for (const fname of ["README.md", "main.py", "crew.py", "agents.yaml", "tasks.yaml"]) {
          const content = await getRawFile("crewAIInc", "crewAI-examples", `${dir}/${tmpl.name}/${fname}`);
          if (content) {
            const mime = fname.endsWith(".py") ? "text/x-python" : fname.endsWith(".yaml") ? "text/yaml" : "text/markdown";
            const res = await uploadFile(folderId, fname, content, mime);
            console.log(`    ${res.status === "exists" ? "⏭ " : "✅"} ${dir}/${tmpl.name}/${fname}`);
            total++;
          }
        }
      } catch (e) {
        console.log(`    ❌ ${tmpl.name}: ${e.message.substring(0, 60)}`);
      }
    }
  }
  console.log(`\n  📊 CrewAI files synced: ${total}`);
  return total;
}

// --- Source: Langflow ---
async function syncLangflow() {
  console.log("\n🌊 === SYNCING LANGFLOW TEMPLATES ===\n");

  const path = "src/backend/base/langflow/initial_setup/starter_projects";
  const contents = await getRepoContents("langflow-ai", "langflow", path);
  if (!Array.isArray(contents)) { console.log("  ❌ Could not list templates"); return 0; }

  const files = contents.filter(f => f.name.endsWith(".json") || f.name.endsWith(".py"));
  console.log(`  📂 Found ${files.length} template files`);

  let total = 0;
  for (const file of files) {
    try {
      const content = await getRawFile("langflow-ai", "langflow", `${path}/${file.name}`);
      if (!content) continue;
      const mime = file.name.endsWith(".json") ? "application/json" : "text/x-python";
      const folderId = await createFolderPath(["AI-Catalog", "Langflow"]);
      const res = await uploadFile(folderId, file.name, content, mime);
      console.log(`    ${res.status === "exists" ? "⏭ " : "✅"} ${file.name}`);
      total++;
    } catch (e) {
      console.log(`    ❌ ${file.name}: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`\n  📊 Langflow files synced: ${total}`);
  return total;
}

// --- Source: LLM Catalog ---
async function syncLLMCatalog() {
  console.log("\n🤖 === SYNCING LLM CATALOG ===\n");

  // Fetch top open-source LLM repos from GitHub
  const categories = [
    { q: "large+language+model+open+source", label: "open-source-llms" },
    { q: "llm+framework+agent", label: "llm-frameworks" },
    { q: "llm+fine-tuning+training", label: "llm-training" },
  ];

  let total = 0;
  for (const cat of categories) {
    console.log(`\n  📂 ${cat.label}`);
    try {
      const data = await githubFetch(`/search/repositories?q=${cat.q}&sort=stars&per_page=30`);
      const repos = data.items || [];

      // Create a catalog markdown for each category
      let catalog = `# ${cat.label}\n\nTop open-source repositories:\n\n`;
      catalog += `| # | Repository | Stars | Description |\n|---|---|---|---|\n`;

      for (let i = 0; i < repos.length; i++) {
        const r = repos[i];
        catalog += `| ${i + 1} | [${r.full_name}](${r.html_url}) | ${r.stargazers_count.toLocaleString()} | ${(r.description || "").substring(0, 80)} |\n`;
      }

      catalog += `\n\n_Last synced: ${new Date().toISOString()}_\n`;

      const folderId = await createFolderPath(["AI-Catalog", "LLMs"]);
      const res = await uploadFile(folderId, `${cat.label}.md`, catalog);
      console.log(`    ${res.status === "exists" ? "⏭ " : "✅"} ${cat.label}.md (${repos.length} repos)`);
      total++;

      // Also download README from top 5 repos in each category
      for (const repo of repos.slice(0, 5)) {
        try {
          const readme = await getRawFile(repo.owner.login, repo.name, "README.md");
          if (!readme) continue;
          const subFolder = await createFolderPath(["AI-Catalog", "LLMs", cat.label, repo.name]);
          const r = await uploadFile(subFolder, "README.md", readme);
          console.log(`    ${r.status === "exists" ? "⏭ " : "✅"} ${repo.full_name}/README.md`);
          total++;
        } catch {}
      }

      await new Promise(r => setTimeout(r, 2000));
    } catch (e) {
      console.log(`    ❌ Error: ${e.message.substring(0, 80)}`);
    }
  }
  console.log(`\n  📊 LLM files synced: ${total}`);
  return total;
}

// --- Source: Open Source AI Tools ---
async function syncOpenSourceTools() {
  console.log("\n🔧 === SYNCING OPEN SOURCE AI TOOLS ===\n");
  const repos = [
    "langchain-ai/langchain", "run-llama/llama_index", "deepset-ai/haystack",
    "huggingface/transformers", "vllm-project/vllm", "ggerganov/llama.cpp",
    "ollama/ollama", "mozilla/llamafile", "mlc-ai/mlc-llm",
    "lm-sys/FastChat", "oobabooga/text-generation-webui", "mudler/LocalAI",
    "nomic-ai/gpt4all", "jmorganca/ollama", "bentoml/OpenLLM",
    "marella/ctransformers", "turboderp/exllamav2", "abetlen/llama-cpp-python",
    "InternLM/lmdeploy", "ModelTC/lightllm", "predibase/lorax",
    "unslothai/unsloth", "hiyouga/LLaMA-Factory", "axolotl-ai-cloud/axolotl",
    "Lightning-AI/litgpt", "EleutherAI/lm-evaluation-harness",
    "confident-ai/deepeval", "explodinggradients/ragas",
    "chroma-core/chroma", "qdrant/qdrant", "weaviate/weaviate",
  ];
  return await syncRepoList(repos, "AI-Tools");
}

// --- Source: AI Frameworks ---
async function syncFrameworks() {
  console.log("\n🏗️ === SYNCING AI FRAMEWORKS ===\n");
  const repos = [
    "microsoft/autogen", "microsoft/semantic-kernel", "stanfordnlp/dspy",
    "pydantic/pydantic-ai", "anthropics/anthropic-cookbook",
    "openai/openai-cookbook", "google/generative-ai-docs",
    "vercel/ai", "Significant-Gravitas/AutoGPT",
    "modelcontextprotocol/servers", "modelcontextprotocol/typescript-sdk",
    "modelcontextprotocol/python-sdk", "BerriAI/litellm",
    "instructor-ai/instructor", "outlines-dev/outlines",
    "guidance-ai/guidance", "jxnl/instructor",
    "letta-ai/letta", "phidatahq/phidata",
    "composiodev/composio", "e2b-dev/e2b",
    "BuilderIO/gpt-crawler", "mendableai/firecrawl",
    "assafelovic/gpt-researcher", "langgenius/dify",
    "FlowiseAI/Flowise", "n8n-io/n8n",
    "activepieces/activepieces", "windmill-labs/windmill",
  ];
  return await syncRepoList(repos, "AI-Frameworks");
}

// --- Source: AI Agents ---
async function syncAgents() {
  console.log("\n🤖 === SYNCING AI AGENTS ===\n");
  const repos = [
    "Significant-Gravitas/AutoGPT", "geekan/MetaGPT", "reworkd/AgentGPT",
    "yoheinakajima/babyagi", "TransformerOptimus/SuperAGI",
    "OpenBMB/ChatDev", "stitionai/devika", "Pythagora-io/gpt-pilot",
    "princeton-nlp/SWE-agent", "OpenDevin/OpenDevin",
    "SWE-bench/SWE-bench", "aorwall/moatless-tools",
    "paul-gauthier/aider", "smol-ai/developer",
    "AntonOsika/gpt-engineer", "BuilderIO/ai-shell",
    "khoj-ai/khoj", "mem0ai/mem0",
    "AgentOps-AI/agentops", "crewAIInc/crewAI",
    "joaomdmoura/crewAI", "microsoft/TaskWeaver",
    "openchatai/OpenChat", "lobehub/lobe-chat",
    "open-webui/open-webui", "danny-avila/LibreChat",
    "BerriAI/litellm", "janhq/jan",
    "chatbot-ui/chatbot-ui", "mckaywrigley/chatbot-ui",
  ];
  return await syncRepoList(repos, "AI-Agents-Chatbots");
}

// --- Source: Text-to-Image ---
async function syncTextToImage() {
  console.log("\n🎨 === SYNCING TEXT-TO-IMAGE ===\n");
  const repos = [
    "AUTOMATIC1111/stable-diffusion-webui", "comfyanonymous/ComfyUI",
    "lllyasviel/Fooocus", "invoke-ai/InvokeAI", "bmaltais/kohya_ss",
    "lllyasviel/stable-diffusion-webui-forge", "mcmonkeyprojects/SwarmUI",
    "Stability-AI/stablediffusion", "CompVis/stable-diffusion",
    "huggingface/diffusers", "black-forest-labs/flux",
    "tencent/HunyuanDiT", "PixArt-alpha/PixArt-alpha",
    "lllyasviel/ControlNet", "Mikubill/sd-webui-controlnet",
    "mlfoundations/open_clip", "kakaobrain/karlo",
    "lucidrains/DALLE2-pytorch", "borisdayma/dalle-mini",
    "drawthingsai/draw-things-community",
  ];
  return await syncRepoList(repos, "Text-to-Image");
}

// --- Source: Text-to-Speech ---
async function syncTextToSpeech() {
  console.log("\n🔊 === SYNCING TEXT-TO-SPEECH ===\n");
  const repos = [
    "coqui-ai/TTS", "suno-ai/bark", "myshell-ai/OpenVoice",
    "fishaudio/fish-speech", "RVC-Project/Retrieval-based-Voice-Conversion-WebUI",
    "2noise/ChatTTS", "netease-youdao/EmotiVoice",
    "jasonppy/VoiceCraft", "Plachtaa/VALL-E-X",
    "collabora/WhisperSpeech", "SWivid/F5-TTS",
    "metavoiceio/metavoice-src", "mozilla/TTS",
    "espnet/espnet", "NATSpeech/NATSpeech",
    "openai/whisper", "ggerganov/whisper.cpp",
    "m-bain/whisperX", "Vaibhavs10/insanely-fast-whisper",
    "guillaumekln/faster-whisper",
  ];
  return await syncRepoList(repos, "Text-to-Speech");
}

// --- Source: Headless APIs ---
async function syncHeadlessAPIs() {
  console.log("\n🔗 === SYNCING HEADLESS API TOOLS ===\n");
  const repos = [
    "strapi/strapi", "directus/directus", "payloadcms/payload",
    "sanity-io/sanity", "keystonejs/keystone", "pocketbase/pocketbase",
    "supabase/supabase", "appwrite/appwrite", "hasura/graphql-engine",
    "nocodb/nocodb", "parse-community/parse-server",
    "ghostcms/Ghost", "wagtail/wagtail", "django-cms/django-cms",
    "refinedev/refine", "medusajs/medusa",
    "saleor/saleor", "vendure-ecommerce/vendure",
    "frappe/frappe", "casdoor/casdoor",
  ];
  return await syncRepoList(repos, "Headless-APIs");
}

// --- Source: Image Editors ---
async function syncImageEditors() {
  console.log("\n🖼️ === SYNCING IMAGE EDITORS ===\n");
  const repos = [
    "nicbarker/clay", "nicbarker/clay",
    "nicbarker/clay", "nicbarker/clay",
    "nicbarker/clay", "nicbarker/clay",
  ];
  // Use search instead for broader coverage
  const data = await githubFetch("/search/repositories?q=open+source+image+editor+OR+photo+editor+OR+image+processing+OR+image+manipulation&sort=stars&per_page=30");
  const allRepos = (data.items || []).map(r => `${r.owner.login}/${r.name}`);
  // Add known ones
  const known = [
    "nicbarker/clay", "nicbarker/clay",
    "nicbarker/clay", "nicbarker/clay",
  ];
  // Deduplicate and use actual known repos
  const finalRepos = [
    "nicbarker/clay",
  ];
  return 0;
}

// --- Actually, let me use a cleaner approach ---

// --- Source: Image & Video Editing ---
async function syncImageVideoEditing() {
  console.log("\n🎬 === SYNCING IMAGE & VIDEO EDITING TOOLS ===\n");

  const imageRepos = [
    "nicbarker/clay",
  ];

  return 0;
}

// --- Generic repo list sync ---
async function syncRepoList(repos, folderName) {
  let total = 0;
  for (const fullName of repos) {
    const [owner, repo] = fullName.split("/");
    try {
      // Get repo info
      const info = await githubFetch(`/repos/${owner}/${repo}`);
      const readme = await getRawFile(owner, repo, "README.md");
      if (!readme) { console.log(`  ⏭  ${fullName} - no README`); continue; }

      // Create info card
      const card = `# ${info.full_name}\n\n` +
        `- **Stars:** ${info.stargazers_count.toLocaleString()}\n` +
        `- **Language:** ${info.language || "N/A"}\n` +
        `- **License:** ${info.license?.name || "N/A"}\n` +
        `- **URL:** ${info.html_url}\n` +
        `- **Description:** ${info.description || "N/A"}\n` +
        `- **Topics:** ${(info.topics || []).join(", ")}\n` +
        `- **Last Updated:** ${info.updated_at}\n\n---\n\n`;

      const folderId = await createFolderPath(["AI-Catalog", folderName, repo]);

      // Upload info card
      const r1 = await uploadFile(folderId, "INFO.md", card);
      console.log(`  ${r1.status === "exists" ? "⏭ " : "✅"} ${fullName}/INFO.md (⭐${info.stargazers_count.toLocaleString()})`);
      total++;

      // Upload README
      const r2 = await uploadFile(folderId, "README.md", readme);
      console.log(`  ${r2.status === "exists" ? "⏭ " : "✅"} ${fullName}/README.md`);
      total++;

      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ❌ ${fullName}: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`\n  📊 ${folderName} files synced: ${total}`);
  return total;
}

// --- Main ---
async function main() {
  console.log("🚀 Master AI Catalog Sync → Liferay AgentNXXT");
  console.log("=" .repeat(50));

  // Test Liferay connection
  try {
    await liferayFetch(`/o/headless-admin-user/v1.0/my-user-account`);
    console.log("✅ Liferay connection OK\n");
  } catch (e) {
    console.error("❌ Cannot connect to Liferay:", e.message);
    return;
  }

  const results = {};

  // Run syncs
  const source = process.argv[2] || "all";

  if (source === "all" || source === "prompts") {
    results.prompts = await syncPrompts();
  }
  if (source === "all" || source === "crewai") {
    results.crewai = await syncCrewAI();
  }
  if (source === "all" || source === "langflow") {
    results.langflow = await syncLangflow();
  }
  if (source === "all" || source === "llms") {
    results.llms = await syncLLMCatalog();
  }
  if (source === "all" || source === "tools") {
    results.tools = await syncOpenSourceTools();
  }
  if (source === "all" || source === "frameworks") {
    results.frameworks = await syncFrameworks();
  }
  if (source === "all" || source === "agents") {
    results.agents = await syncAgents();
  }
  if (source === "all" || source === "image") {
    results.image = await syncTextToImage();
  }
  if (source === "all" || source === "speech") {
    results.speech = await syncTextToSpeech();
  }
  if (source === "all" || source === "headless") {
    results.headless = await syncHeadlessAPIs();
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SYNC COMPLETE\n");
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v} files`);
  }
  console.log(`\n  Total: ${Object.values(results).reduce((a, b) => a + b, 0)} files`);
  console.log(`  Target: Liferay AgentNXXT (Site ID: ${SITE_ID})`);
  console.log(`  Folder: AI-Catalog/`);
}

main().catch(console.error);
