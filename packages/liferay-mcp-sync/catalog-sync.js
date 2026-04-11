#!/usr/bin/env node

/**
 * AI Catalog Sync → Liferay Custom Object (AI Tool)
 * Populates structured entries with Gartner categories, tags, and relationships
 * API: /o/c/aitools
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LIFERAY_URL = process.env.LIFERAY_URL || "http://51.75.251.56:8080";
const LIFERAY_USER = process.env.LIFERAY_USER || "test@liferay.com";
const LIFERAY_PASS = process.env.LIFERAY_PASS || "123456";
const AUTH_HEADER = "Basic " + Buffer.from(`${LIFERAY_USER}:${LIFERAY_PASS}`).toString("base64");

// --- GitHub ---
async function githubFetch(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json", "User-Agent": "catalog-sync" }
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  return r.json();
}

// --- Liferay ---
async function createAITool(entry) {
  const r = await fetch(`${LIFERAY_URL}/o/c/aitools`, {
    method: "POST",
    headers: { Authorization: AUTH_HEADER, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!r.ok) {
    const t = await r.text();
    if (t.includes("Duplicate") || t.includes("already")) return { status: "exists" };
    throw new Error(`Liferay ${r.status}: ${t.substring(0, 100)}`);
  }
  return r.json();
}

async function searchAITool(slug) {
  try {
    const r = await fetch(`${LIFERAY_URL}/o/c/aitools?filter=slug eq '${slug}'&pageSize=1`, {
      headers: { Authorization: AUTH_HEADER, Accept: "application/json" }
    });
    const d = await r.json();
    return d.items?.[0] || null;
  } catch { return null; }
}

async function addRelationship(toolId, relatedToolId) {
  try {
    await fetch(`${LIFERAY_URL}/o/c/aitools/${toolId}/relatedTools/${relatedToolId}`, {
      method: "PUT",
      headers: { Authorization: AUTH_HEADER, Accept: "application/json", "Content-Type": "application/json" },
    });
  } catch {}
}

// --- Catalog data ---
const CATALOG = {
  // ============ FRAMEWORKS ============
  "AI-Frameworks": {
    gartnerCategory: "AI Application Development Platforms",
    toolType: "Framework",
    repos: [
      "langchain-ai/langchain", "run-llama/llama_index", "microsoft/autogen",
      "microsoft/semantic-kernel", "stanfordnlp/dspy", "pydantic/pydantic-ai",
      "crewAIInc/crewAI", "langgenius/dify", "FlowiseAI/Flowise",
      "n8n-io/n8n", "BerriAI/litellm", "instructor-ai/instructor",
      "outlines-dev/outlines", "guidance-ai/guidance", "letta-ai/letta",
      "phidatahq/phidata", "composiodev/composio", "e2b-dev/e2b",
      "deepset-ai/haystack", "vercel/ai",
    ],
  },

  // ============ AGENTS & CHATBOTS ============
  "AI-Agents": {
    gartnerCategory: "Conversational AI Platforms",
    toolType: "Agent",
    repos: [
      "Significant-Gravitas/AutoGPT", "geekan/MetaGPT", "reworkd/AgentGPT",
      "yoheinakajima/babyagi", "TransformerOptimus/SuperAGI",
      "OpenBMB/ChatDev", "stitionai/devika", "Pythagora-io/gpt-pilot",
      "princeton-nlp/SWE-agent", "OpenDevin/OpenDevin",
      "paul-gauthier/aider", "smol-ai/developer",
      "AntonOsika/gpt-engineer", "khoj-ai/khoj", "mem0ai/mem0",
    ],
  },

  "Chatbots": {
    gartnerCategory: "Conversational AI Platforms",
    toolType: "Chatbot",
    repos: [
      "open-webui/open-webui", "danny-avila/LibreChat", "janhq/jan",
      "mckaywrigley/chatbot-ui", "lobehub/lobe-chat",
      "openchatai/OpenChat", "BerriAI/litellm",
      "lm-sys/FastChat", "oobabooga/text-generation-webui",
    ],
  },

  // ============ LLMs ============
  "LLMs": {
    gartnerCategory: "Data Science and Machine Learning Platforms",
    toolType: "LLM",
    repos: [
      "huggingface/transformers", "vllm-project/vllm", "ggerganov/llama.cpp",
      "ollama/ollama", "mozilla/llamafile", "mlc-ai/mlc-llm",
      "nomic-ai/gpt4all", "bentoml/OpenLLM", "mudler/LocalAI",
      "abetlen/llama-cpp-python", "turboderp/exllamav2",
      "unslothai/unsloth", "hiyouga/LLaMA-Factory",
      "Lightning-AI/litgpt", "predibase/lorax",
    ],
  },

  // ============ TEXT-TO-IMAGE ============
  "Text-to-Image": {
    gartnerCategory: "AI Application Development Platforms",
    toolType: "Text-to-Image",
    repos: [
      "AUTOMATIC1111/stable-diffusion-webui", "comfyanonymous/ComfyUI",
      "lllyasviel/Fooocus", "invoke-ai/InvokeAI", "bmaltais/kohya_ss",
      "Stability-AI/stablediffusion", "huggingface/diffusers",
      "lllyasviel/ControlNet", "CompVis/stable-diffusion",
      "mcmonkeyprojects/SwarmUI",
    ],
  },

  // ============ TEXT-TO-SPEECH ============
  "Text-to-Speech": {
    gartnerCategory: "AI Application Development Platforms",
    toolType: "Text-to-Speech",
    repos: [
      "coqui-ai/TTS", "suno-ai/bark", "myshell-ai/OpenVoice",
      "fishaudio/fish-speech", "2noise/ChatTTS", "netease-youdao/EmotiVoice",
      "openai/whisper", "ggerganov/whisper.cpp", "m-bain/whisperX",
      "guillaumekln/faster-whisper", "SWivid/F5-TTS",
    ],
  },

  // ============ IMAGE EDITORS ============
  "Image-Editors": {
    gartnerCategory: "Digital Asset Management",
    toolType: "Image-Editor",
    repos: [
      "nicbarker/clay", "nicbarker/clay", // will be replaced by search
    ],
  },

  // ============ VIDEO EDITING ============
  "Video-Editing": {
    gartnerCategory: "Digital Asset Management",
    toolType: "Video-Editor",
    repos: [],
  },

  // ============ SEARCH ============
  "Search-Engines": {
    gartnerCategory: "Enterprise Search",
    toolType: "Search",
    repos: [
      "meilisearch/meilisearch", "typesense/typesense", "quickwit-oss/quickwit",
      "zincsearch/zincsearch", "manticoresoftware/manticoresearch",
      "chroma-core/chroma", "qdrant/qdrant", "weaviate/weaviate",
      "milvus-io/milvus", "vespa-engine/vespa",
    ],
  },

  // ============ PDF PROCESSING ============
  "PDF-Processing": {
    gartnerCategory: "Intelligent Document Processing",
    toolType: "PDF-Tool",
    repos: [
      "py-pdf/pypdf", "pymupdf/PyMuPDF", "jsvine/pdfplumber",
      "unstructuredai/unstructured", "Unstructured-IO/unstructured",
      "opendatalab/MinerU", "VikParuchuri/marker",
      "deepdoctection/deepdoctection", "Layout-Parser/layout-parser",
      "PaddlePaddle/PaddleOCR",
    ],
  },

  // ============ DATASETS ============
  "Datasets": {
    gartnerCategory: "Data Science and Machine Learning Platforms",
    toolType: "Dataset-Tool",
    repos: [
      "huggingface/datasets", "activeloopai/deeplake",
      "lightly-ai/lightly", "cleanlab/cleanlab",
      "snorkel-team/snorkel", "argilla-io/argilla",
      "Label-Studio/label-studio", "doccano/doccano",
      "cvat-ai/cvat", "heartexlabs/labelImg",
    ],
  },

  // ============ RAG ============
  "RAG": {
    gartnerCategory: "Knowledge Management Tools",
    toolType: "RAG",
    repos: [
      "run-llama/llama_index", "langchain-ai/langchain",
      "chroma-core/chroma", "qdrant/qdrant",
      "weaviate/weaviate", "milvus-io/milvus",
      "explodinggradients/ragas", "deepset-ai/haystack",
      "Unstructured-IO/unstructured", "stanfordnlp/dspy",
    ],
  },

  // ============ MLOps ============
  "MLOps": {
    gartnerCategory: "Data Science and Machine Learning Platforms",
    toolType: "MLOps",
    repos: [
      "mlflow/mlflow", "wandb/wandb", "iterative/dvc",
      "kubeflow/kubeflow", "bentoml/BentoML",
      "ray-project/ray", "prefecthq/prefect",
      "apache/airflow", "dagster-io/dagster",
      "Netflix/metaflow",
    ],
  },

  // ============ HEADLESS APIs ============
  "Headless-APIs": {
    gartnerCategory: "Content Management Systems",
    toolType: "Headless-CMS",
    repos: [
      "strapi/strapi", "directus/directus", "payloadcms/payload",
      "keystonejs/keystone", "pocketbase/pocketbase",
      "supabase/supabase", "appwrite/appwrite",
      "nocodb/nocodb", "hasura/graphql-engine",
      "refinedev/refine",
    ],
  },

  // ============ NO-CODE / LOW-CODE ============
  "No-Code-Low-Code": {
    gartnerCategory: "Enterprise Low-Code Application Platforms",
    toolType: "Low-Code",
    repos: [
      "n8n-io/n8n", "activepieces/activepieces", "windmill-labs/windmill",
      "automatisch/automatisch", "PipedreamHQ/pipedream",
      "tooljet/tooljet", "appsmithorg/appsmith",
      "illacloud/illa-builder", "budibase/budibase",
      "nocobase/nocobase",
    ],
  },

  // ============ DATA INTEGRATION ============
  "Data-Integration": {
    gartnerCategory: "Data Integration Tools",
    toolType: "Data-Integration",
    repos: [
      "airbytehq/airbyte", "singer-io/getting-started",
      "meltano/meltano", "dbt-labs/dbt-core",
      "PrefectHQ/prefect", "dagster-io/dagster",
      "apache/airflow", "getredash/redash",
      "metabase/metabase", "apache/superset",
    ],
  },

  // ============ AI CODE ASSISTANTS ============
  "AI-Code": {
    gartnerCategory: "AI Code Assistants",
    toolType: "Code-Assistant",
    repos: [
      "continuedev/continue", "TabbyML/tabby", "fauxpilot/fauxpilot",
      "codeium-ai/codeium", "codota/TabNine",
      "sourcegraph/cody", "cursor-ai/cursor",
      "replit/replit-code-v1-3b", "bigcode-project/starcoder",
      "Codium-ai/pr-agent",
    ],
  },

  // ============ OBSERVABILITY ============
  "Observability": {
    gartnerCategory: "Observability Platforms",
    toolType: "Observability",
    repos: [
      "grafana/grafana", "prometheus/prometheus", "open-telemetry/opentelemetry-collector",
      "SigNoz/signoz", "uptrace/uptrace",
      "highlight/highlight", "hyperdxio/hyperdx",
      "jaegertracing/jaeger", "openzipkin/zipkin",
      "getsentry/sentry",
    ],
  },
};

// --- IBM Think Topics mapping ---
const IBM_TOPICS = {
  "Framework": "artificial-intelligence,automation,cloud",
  "Agent": "artificial-intelligence,automation,natural-language-processing",
  "Chatbot": "artificial-intelligence,natural-language-processing,customer-experience",
  "LLM": "artificial-intelligence,machine-learning,deep-learning,natural-language-processing",
  "Text-to-Image": "artificial-intelligence,computer-vision,generative-ai",
  "Text-to-Speech": "artificial-intelligence,natural-language-processing,speech-recognition",
  "Image-Editor": "design,digital-transformation",
  "Video-Editor": "design,digital-transformation,media",
  "Search": "data-management,artificial-intelligence,information-retrieval",
  "PDF-Tool": "automation,data-management,document-processing",
  "Dataset-Tool": "data-management,machine-learning,data-science",
  "RAG": "artificial-intelligence,natural-language-processing,knowledge-management",
  "MLOps": "machine-learning,devops,automation,cloud",
  "Headless-CMS": "cloud,api,content-management,digital-transformation",
  "Low-Code": "automation,cloud,application-development",
  "Data-Integration": "data-management,analytics,integration",
  "Code-Assistant": "artificial-intelligence,software-development,automation",
  "Observability": "cloud,devops,monitoring,analytics",
};

// --- Dynamic discovery for categories with empty repos ---
async function discoverRepos(query, count = 10) {
  try {
    const data = await githubFetch(`/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${count}`);
    return (data.items || []).map(r => `${r.owner.login}/${r.name}`);
  } catch { return []; }
}

// --- Main sync ---
async function main() {
  console.log("🚀 AI Catalog → Liferay Custom Object Sync");
  console.log("=".repeat(50) + "\n");

  // Test Liferay
  try {
    const r = await fetch(`${LIFERAY_URL}/o/c/aitools?pageSize=1`, {
      headers: { Authorization: AUTH_HEADER, Accept: "application/json" }
    });
    const d = await r.json();
    console.log(`✅ Liferay OK — ${d.totalCount || 0} existing entries\n`);
  } catch (e) {
    console.error("❌ Liferay unreachable:", e.message);
    return;
  }

  // Fill in empty repo lists with search
  if (CATALOG["Image-Editors"].repos.length <= 2) {
    CATALOG["Image-Editors"].repos = await discoverRepos("open source image editor photo editor canvas", 10);
  }
  if (CATALOG["Video-Editing"].repos.length === 0) {
    CATALOG["Video-Editing"].repos = await discoverRepos("open source video editor NLE timeline editing", 10);
  }

  let grandTotal = 0;
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const createdIds = {}; // slug -> id for relationships

  for (const [category, config] of Object.entries(CATALOG)) {
    console.log(`\n📂 ${category} (${config.repos.length} repos)`);
    console.log("-".repeat(40));

    const uniqueRepos = [...new Set(config.repos)];

    for (const fullName of uniqueRepos) {
      const [owner, repo] = fullName.split("/");
      const slug = fullName.replace("/", "-").toLowerCase();

      // Check if already exists
      const existing = await searchAITool(slug);
      if (existing) {
        console.log(`  ⏭  ${fullName} — exists`);
        createdIds[slug] = existing.id;
        skipped++;
        grandTotal++;
        continue;
      }

      try {
        const info = await githubFetch(`/repos/${owner}/${repo}`);

        const entry = {
          toolName: info.name,
          slug,
          toolType: config.toolType,
          githubUrl: info.html_url,
          websiteUrl: info.homepage || "",
          githubStars: info.stargazers_count,
          licenseName: info.license?.spdx_id || info.license?.name || "Unknown",
          primaryLanguage: info.language || "N/A",
          toolDescription: (info.description || "").substring(0, 2000),
          toolTags: (info.topics || []).join(", "),
          gartnerCategory: config.gartnerCategory,
          ibmTopics: IBM_TOPICS[config.toolType] || "technology",
        };

        const result = await createAITool(entry);
        if (result.status === "exists") {
          console.log(`  ⏭  ${fullName} — duplicate`);
          skipped++;
        } else {
          console.log(`  ✅ ${fullName} (⭐${info.stargazers_count.toLocaleString()} | ${config.gartnerCategory})`);
          createdIds[slug] = result.id;
          created++;
        }
        grandTotal++;

        await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        console.log(`  ❌ ${fullName}: ${e.message.substring(0, 60)}`);
        failed++;
        grandTotal++;
      }
    }
  }

  // --- Create relationships ---
  console.log("\n\n🔗 === CREATING RELATIONSHIPS ===\n");

  const relationships = [
    // Framework ↔ Agents
    ["crewaiinc-crewai", "crewaiinc-crewai"], // self-skip
    ["langchain-ai-langchain", "run-llama-llama_index"],
    ["langchain-ai-langchain", "deepset-ai-haystack"],
    ["microsoft-autogen", "microsoft-semantic-kernel"],
    // Frameworks ↔ Chatbots
    ["langchain-ai-langchain", "langgenius-dify"],
    ["langchain-ai-langchain", "flowiseai-flowise"],
    // LLMs ↔ Tools
    ["huggingface-transformers", "huggingface-diffusers"],
    ["huggingface-transformers", "huggingface-datasets"],
    ["ggerganov-llama.cpp", "ollama-ollama"],
    ["ollama-ollama", "open-webui-open-webui"],
    // RAG connections
    ["chroma-core-chroma", "langchain-ai-langchain"],
    ["qdrant-qdrant", "run-llama-llama_index"],
    ["weaviate-weaviate", "deepset-ai-haystack"],
    // Search ↔ RAG
    ["meilisearch-meilisearch", "typesense-typesense"],
    // Data
    ["airbytehq-airbyte", "dbt-labs-dbt-core"],
    ["apache-airflow", "dagster-io-dagster"],
    ["metabase-metabase", "apache-superset"],
    // Code
    ["continuedev-continue", "tabbyml-tabby"],
    // Observability
    ["grafana-grafana", "prometheus-prometheus"],
    ["signoz-signoz", "jaegertracing-jaeger"],
  ];

  let relCount = 0;
  for (const [slug1, slug2] of relationships) {
    if (slug1 === slug2) continue;
    const id1 = createdIds[slug1];
    const id2 = createdIds[slug2];
    if (id1 && id2) {
      await addRelationship(id1, id2);
      console.log(`  🔗 ${slug1} ↔ ${slug2}`);
      relCount++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 CATALOG SYNC COMPLETE\n");
  console.log(`  ✅ Created:      ${created}`);
  console.log(`  ⏭  Skipped:      ${skipped}`);
  console.log(`  ❌ Failed:       ${failed}`);
  console.log(`  🔗 Relationships: ${relCount}`);
  console.log(`  📦 Total:        ${grandTotal}`);
  console.log(`\n  API: ${LIFERAY_URL}/o/c/aitools`);
}

main().catch(console.error);
