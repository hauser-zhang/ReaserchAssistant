const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const rootDir = __dirname;

const providerDefaults = {
  gpt: {
    model: "gpt-5.1",
    baseUrl: "https://api.openai.com/v1"
  },
  gemini: {
    model: "gemini-1.5-pro",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta"
  },
  deepseek: {
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1"
  }
};

const SYSTEM_PROMPT =
  "You are an academic writing assistant for doctoral dissertations. Return JSON only with no extra text.";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url.pathname);
    return;
  }

  if (req.method !== "GET") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  const filePath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const resolvedPath = path.join(rootDir, filePath);

  if (!resolvedPath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(resolvedPath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
});

function handleApi(req, res, pathname) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method Not Allowed" });
    return;
  }

  collectJson(req, async (body) => {
    try {
      const data = body || {};
      let response;

      switch (pathname) {
        case "/api/topic":
          response = await handleTopic(data);
          break;
        case "/api/outline":
          response = await handleOutline(data);
          break;
        case "/api/draft":
          response = await handleDraft(data);
          break;
        case "/api/polish":
          response = await handlePolish(data);
          break;
        case "/api/search-refs":
          response = await handleSearch(data);
          break;
        case "/api/insert-refs":
          response = await handleCitations(data);
          break;
        default:
          json(res, 404, { error: "Unknown endpoint" });
          return;
      }

      json(res, 200, response);
    } catch (error) {
      json(res, 500, { error: "Failed to generate response" });
    }
  });
}

function collectJson(req, callback) {
  let raw = "";
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > 1e6) {
      req.destroy();
    }
  });
  req.on("end", () => {
    try {
      callback(raw ? JSON.parse(raw) : {});
    } catch (error) {
      callback({});
    }
  });
}

function json(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function handleTopic(data) {
  const context = parseContext(data);
  return generateWithModel("topic", data, context);
}

async function handleOutline(data) {
  const context = parseContext(data);
  return generateWithModel("outline", data, context);
}

async function handleDraft(data) {
  const context = parseContext(data);
  return generateWithModel("draft", data, context);
}

async function handlePolish(data) {
  const context = parseContext(data);
  return generateWithModel("polish", data, context);
}

async function handleSearch(data) {
  const context = parseContext(data);
  return generateWithModel("search", data, context);
}

async function handleCitations(data) {
  const context = parseContext(data);
  return generateWithModel("citations", data, context);
}

function parseContext(data) {
  const project = data.project || {};
  const input = String(data.input || "");
  const draftText = String(data.draftText || "");
  const references = Array.isArray(data.references) ? data.references : [];
  const language = String(project.language || "");
  const isZh = language === "zh" || /[\u4e00-\u9fff]/.test(input + draftText);
  const keywordList = parseKeywordList(project.keywords || "");
  const keywordText = keywordList.join(" / ");
  const focus = keywordText || extractSnippet(input || draftText, isZh) || (isZh ? "关键主题" : "core topics");
  const referenceText = buildReferenceText(references, 5000);

  return {
    project,
    input,
    draftText,
    references,
    isZh,
    keywordList,
    keywords: keywordText,
    focus,
    referenceText,
    field: project.field || (isZh ? "研究领域" : "the field"),
    method: project.method || (isZh ? "研究方法" : "methodological")
  };
}

function parseKeywordList(text) {
  if (!text) {
    return [];
  }
  return String(text)
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function extractSnippet(text, isZh) {
  if (!text) {
    return "";
  }
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "";
  }
  if (isZh) {
    return cleaned.replace(/\s+/g, "").slice(0, 16);
  }
  return cleaned.split(/\s+/).slice(0, 6).join(" ");
}

function buildReferenceText(references, maxLength) {
  if (!references || !references.length) {
    return "";
  }
  const chunks = [];
  let total = 0;
  references.forEach((ref) => {
    const content = String(ref.content || "").replace(/\s+/g, " ").trim();
    if (!content) {
      return;
    }
    const label = ref.name ? `Source: ${ref.name}\n` : "";
    const snippet = content.slice(0, 1200);
    const block = `${label}${snippet}`;
    if (total + block.length > maxLength) {
      const remaining = maxLength - total;
      if (remaining > 80) {
        chunks.push(block.slice(0, remaining));
      }
      total = maxLength;
      return;
    }
    chunks.push(block);
    total += block.length;
  });
  return chunks.join("\n\n");
}

function buildError(context, zhMessage, enMessage) {
  return { error: context.isZh ? zhMessage : enMessage };
}

async function generateWithModel(moduleName, data, context) {
  const model = normalizeModel(data.model || {});
  if (!model.apiKey || !model.model) {
    return buildError(
      context,
      "请先在首页配置 API Key 与模型 ID。",
      "Please configure the API key and model ID on the home page."
    );
  }

  if (!context.referenceText) {
    return buildError(
      context,
      "未检测到参考论文文本，请在资料库上传并完成文本提取。",
      "No reference text detected. Upload and extract reference papers in the Library."
    );
  }

  const prompt = buildPrompt(moduleName, data, context);
  if (!prompt) {
    return buildError(context, "提示词生成失败。", "Failed to build the prompt.");
  }

  try {
    const text = await callProvider(model, prompt);
    const parsed = parseJsonPayload(text);
    const normalized = normalizeModuleResponse(moduleName, parsed);
    if (!normalized) {
      return buildError(context, "模型返回格式不正确。", "The model returned invalid JSON.");
    }
    return normalized;
  } catch (error) {
    return buildError(context, "模型调用失败，请检查 API Key。", "Model call failed. Check your API key.");
  }
}

function normalizeModel(model) {
  const provider = String(model.provider || "gpt").toLowerCase();
  const defaults = providerDefaults[provider] || providerDefaults.gpt;
  return {
    provider,
    model: model.model || defaults.model,
    apiKey: model.apiKey || "",
    baseUrl: model.baseUrl || defaults.baseUrl
  };
}

async function callProvider(model, prompt) {
  if (model.provider === "gemini") {
    return callGemini(model, prompt);
  }
  return callOpenAICompatible(model, prompt);
}

async function callOpenAICompatible(model, prompt) {
  const endpoint = buildUrl(model.baseUrl, "chat/completions");
  const payload = {
    model: model.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 1200
  };
  const response = await requestJson(endpoint, payload, {
    Authorization: `Bearer ${model.apiKey}`
  });
  return response?.choices?.[0]?.message?.content || "";
}

async function callGemini(model, prompt) {
  const endpoint = buildUrl(model.baseUrl, `models/${model.model}:generateContent`);
  endpoint.searchParams.set("key", model.apiKey);
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }]
      }
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1200
    }
  };
  const response = await requestJson(endpoint, payload, {});
  return response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function buildUrl(baseUrl, pathName) {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(pathName, base);
}

function requestJson(url, payload, headers) {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;
    const body = JSON.stringify(payload || {});
    const options = {
      method: "POST",
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: `${url.pathname}${url.search}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...headers
      }
    };

    const req = client.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function buildPrompt(moduleName, data, context) {
  const writingLanguage = context.isZh ? "Chinese" : "English";
  const userInput = limitText(context.input, 1200);
  const draftText = limitText(context.draftText, 2000);
  const referenceNames = (context.references || [])
    .slice(0, 8)
    .map((ref) => ref.name)
    .filter(Boolean)
    .join("; ");
  const referenceText = limitText(context.referenceText, 3500);

  const header = [
    `Language: ${writingLanguage}`,
    `Research field: ${context.field}`,
    `Methodology: ${context.method}`,
    `Keywords: ${context.keywords || "-"}`,
    `Core question: ${context.project.research || "-"}`,
    `Target venue: ${context.project.audience || "-"}`,
    `User input: ${userInput || "-"}`,
    `Draft text: ${draftText || "-"}`,
    `Reference titles: ${referenceNames || "-"}`,
    `Reference excerpts: ${referenceText || "-"}`
  ].join("\n");

  if (moduleName === "topic") {
    return `${header}\n\nTask: Generate 5 distinct dissertation title candidates. Use the reference excerpts as primary evidence and incorporate draft text/user input when available. Keep titles concise and academic.\nReturn JSON with this schema: {"titles": ["..."]}.`;
  }

  if (moduleName === "outline") {
    return `${header}\n\nTask: Create a structured dissertation outline with 6-8 section titles and 4-6 logic points based on the reference excerpts.\nReturn JSON with this schema: {"sections": ["..."], "logic": ["..."]}.`;
  }

  if (moduleName === "draft") {
    return `${header}\n\nTask: Write 2-3 academic paragraphs for the requested section grounded in the reference excerpts. Keep the style formal and coherent.\nReturn JSON with this schema: {"draft": "..."}.`;
  }

  if (moduleName === "polish") {
    return `${header}\n\nTask: Polish the provided paragraph to improve academic tone and clarity without changing meaning. Use reference excerpts only to align terminology.\nReturn JSON with this schema: {"polished": "..."}.`;
  }

  if (moduleName === "search") {
    return `${header}\n\nTask: Provide 5-8 literature search results aligned with the reference excerpts, with plausible titles, years, and sources.\nReturn JSON with this schema: {"results": [{"title": "...", "year": 2023, "source": "..."}]}.`;
  }

  if (moduleName === "citations") {
    return `${header}\n\nTask: Suggest 2-4 citations based on the reference excerpts and titles. Use author-year style placeholders if needed.\nReturn JSON with this schema: {"citationBlock": "..."}.`;
  }

  return "";
}

function limitText(text, maxLength) {
  if (!text) {
    return "";
  }
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength)}...`;
}

function parseJsonPayload(text) {
  if (!text) {
    return null;
  }
  const cleaned = String(text).replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }
    try {
      return JSON.parse(match[0]);
    } catch (innerError) {
      return null;
    }
  }
}

function normalizeModuleResponse(moduleName, payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (moduleName === "topic") {
    const titles = Array.isArray(payload.titles)
      ? payload.titles
      : payload.title
      ? [payload.title]
      : [];
    const cleaned = titles.map((title) => String(title).trim()).filter(Boolean);
    return cleaned.length ? { titles: cleaned.slice(0, 8) } : null;
  }

  if (moduleName === "outline") {
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    const logic = Array.isArray(payload.logic) ? payload.logic : [];
    const cleanedSections = sections.map((item) => String(item).trim()).filter(Boolean);
    const cleanedLogic = logic.map((item) => String(item).trim()).filter(Boolean);
    if (!cleanedSections.length) {
      return null;
    }
    return { sections: cleanedSections, logic: cleanedLogic };
  }

  if (moduleName === "draft") {
    if (!payload.draft) {
      return null;
    }
    return { draft: String(payload.draft).trim() };
  }

  if (moduleName === "polish") {
    if (!payload.polished) {
      return null;
    }
    return { polished: String(payload.polished).trim() };
  }

  if (moduleName === "search") {
    const results = Array.isArray(payload.results) ? payload.results : [];
    if (!results.length) {
      return null;
    }
    const cleaned = results
      .map((item) => ({
        title: String(item.title || "").trim(),
        year: Number(item.year || "") || 2023,
        source: String(item.source || "").trim()
      }))
      .filter((item) => item.title && item.source);
    return cleaned.length ? { results: cleaned } : null;
  }

  if (moduleName === "citations") {
    if (!payload.citationBlock) {
      return null;
    }
    return { citationBlock: String(payload.citationBlock).trim() };
  }

  return null;
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
