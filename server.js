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
  const generated = await generateWithModel("topic", data, context);
  return generated || buildTopicMock(context);
}

async function handleOutline(data) {
  const context = parseContext(data);
  const generated = await generateWithModel("outline", data, context);
  return generated || buildOutlineMock(context);
}

async function handleDraft(data) {
  const context = parseContext(data);
  const generated = await generateWithModel("draft", data, context);
  return generated || buildDraftMock(context);
}

async function handlePolish(data) {
  const context = parseContext(data);
  const generated = await generateWithModel("polish", data, context);
  return generated || buildPolishMock(context);
}

async function handleSearch(data) {
  const context = parseContext(data);
  const generated = await generateWithModel("search", data, context);
  return generated || buildSearchMock(context);
}

async function handleCitations(data) {
  const context = parseContext(data);
  const generated = await generateWithModel("citations", data, context);
  return generated || buildCitationsMock(context);
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

  return {
    project,
    input,
    draftText,
    references,
    isZh,
    keywordList,
    keywords: keywordText,
    focus,
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

async function generateWithModel(moduleName, data, context) {
  const model = normalizeModel(data.model || {});
  if (!model.apiKey || !model.model) {
    return null;
  }

  const prompt = buildPrompt(moduleName, data, context);
  if (!prompt) {
    return null;
  }

  try {
    const text = await callProvider(model, prompt);
    const parsed = parseJsonPayload(text);
    return normalizeModuleResponse(moduleName, parsed);
  } catch (error) {
    return null;
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

  const header = [
    `Language: ${writingLanguage}`,
    `Research field: ${context.field}`,
    `Methodology: ${context.method}`,
    `Keywords: ${context.keywords || "-"}`,
    `Core question: ${context.project.research || "-"}`,
    `Target venue: ${context.project.audience || "-"}`,
    `User input: ${userInput || "-"}`,
    `Draft text: ${draftText || "-"}`,
    `Reference titles: ${referenceNames || "-"}`
  ].join("\n");

  if (moduleName === "topic") {
    return `${header}\n\nTask: Generate 5 distinct dissertation title candidates. Use the draft text and user input when available. Keep titles concise and academic.\nReturn JSON with this schema: {"titles": ["..."]}.`;
  }

  if (moduleName === "outline") {
    return `${header}\n\nTask: Create a structured dissertation outline with 6-8 section titles and 4-6 logic points that explain the flow.\nReturn JSON with this schema: {"sections": ["..."], "logic": ["..."]}.`;
  }

  if (moduleName === "draft") {
    return `${header}\n\nTask: Write 2-3 academic paragraphs for the requested section. Keep the style formal and coherent.\nReturn JSON with this schema: {"draft": "..."}.`;
  }

  if (moduleName === "polish") {
    return `${header}\n\nTask: Polish the provided paragraph to improve academic tone and clarity without changing meaning.\nReturn JSON with this schema: {"polished": "..."}.`;
  }

  if (moduleName === "search") {
    return `${header}\n\nTask: Provide 5-8 literature search results with plausible titles, years, and sources.\nReturn JSON with this schema: {"results": [{"title": "...", "year": 2023, "source": "..."}]}.`;
  }

  if (moduleName === "citations") {
    return `${header}\n\nTask: Suggest 2-4 citations based on the reference titles. Use author-year style placeholders if needed.\nReturn JSON with this schema: {"citationBlock": "..."}.`;
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

function buildTopicMock(context) {
  const focus = context.focus;
  return {
    titles: context.isZh
      ? [
          `基于${focus}的${context.field}博士论文题目探析`,
          `${context.field}中${focus}的理论与实践研究`,
          `面向${context.field}的${focus}机制构建与验证`,
          `${context.method}视角下${focus}的系统研究`,
          `${focus}驱动的${context.field}创新路径研究`
        ]
      : [
          `A ${context.method} Study on ${focus} in ${context.field}`,
          `${focus}: A Framework for ${context.field} Innovation`,
          `Understanding ${focus} Dynamics within ${context.field}`,
          `${context.field} Transformation Through ${focus}`,
          `Evidence-Based Insights on ${focus} in ${context.field}`
        ]
  };
}

function buildOutlineMock(context) {
  return {
    sections: context.isZh
      ? ["引言", "文献综述", "研究设计", "数据与方法", "结果与讨论", "结论与展望"]
      : ["Introduction", "Literature Review", "Research Design", "Data & Methods", "Results & Discussion", "Conclusion"],
    logic: context.isZh
      ? [
          "从研究背景切入，定义问题与研究目标",
          "梳理关键文献并定位研究空白",
          "构建理论与方法框架",
          "验证假设并输出关键发现",
          "总结贡献与未来研究方向"
        ]
      : [
          "Frame the research gap and objectives",
          "Review and synthesize core literature",
          "Present the theoretical and methodological framework",
          "Validate hypotheses and discuss findings",
          "Summarize contributions and future work"
        ]
  };
}

function buildDraftMock(context) {
  const focus = context.focus;
  const draft = context.isZh
    ? `本节围绕${focus}展开，首先阐明研究动机与理论背景，并指出${context.field}中的关键挑战。随后结合${context.method}提出研究框架，形成可验证的研究命题。\n\n通过对核心变量的分析，初步发现${focus}在${context.field}场景中呈现出显著的结构性特征，为后续实证验证奠定基础。`
    : `This section focuses on ${focus}. It outlines the motivation and theoretical background, highlighting the key challenges in ${context.field}. A ${context.method} framework is proposed to shape testable propositions.\n\nPreliminary analysis suggests that ${focus} exhibit distinctive structural patterns in ${context.field}, setting the stage for empirical validation.`;
  return { draft };
}

function buildPolishMock(context) {
  const input = String(context.input || "").trim();
  const polished = context.isZh
    ? `润色建议：${input || "请输入需要润色的内容"}（已统一术语、优化逻辑衔接、提升学术表达）`
    : `Polished draft: ${input || "Provide the paragraph to polish."} (terminology aligned, flow improved, academic tone enhanced)`;
  return { polished };
}

function buildSearchMock(context) {
  const focus = context.focus;
  return {
    results: [
      {
        title: context.isZh ? `${focus}的最新研究综述` : `Recent Advances on ${focus}`,
        year: 2023,
        source: "Journal of Research Insights"
      },
      {
        title: context.isZh ? `${context.field}中的${focus}模型构建` : `${focus} Modeling in ${context.field}`,
        year: 2022,
        source: "International Review"
      },
      {
        title: context.isZh ? `${focus}的实证检验` : `Empirical Evidence of ${focus}`,
        year: 2021,
        source: "Academic Reports"
      }
    ]
  };
}

function buildCitationsMock(context) {
  const references = context.references || [];
  const first = references[0]?.name || "Smith et al. (2023)";
  const second = references[1]?.name || "Li & Zhao (2022)";
  const citationBlock = context.isZh
    ? `建议引用：${first}；${second}`
    : `Suggested citations: ${first}; ${second}`;
  return { citationBlock };
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
