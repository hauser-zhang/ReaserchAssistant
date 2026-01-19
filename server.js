const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const rootDir = __dirname;

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

  collectJson(req, (body) => {
    const data = body || {};
    let response;

    switch (pathname) {
      case "/api/topic":
        response = handleTopic(data);
        break;
      case "/api/outline":
        response = handleOutline(data);
        break;
      case "/api/draft":
        response = handleDraft(data);
        break;
      case "/api/polish":
        response = handlePolish(data);
        break;
      case "/api/search-refs":
        response = handleSearch(data);
        break;
      case "/api/insert-refs":
        response = handleCitations(data);
        break;
      default:
        json(res, 404, { error: "Unknown endpoint" });
        return;
    }

    json(res, 200, response);
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

function handleTopic(data) {
  const { isZh, keywords, field, method } = parseContext(data);
  const titles = isZh
    ? [
        `基于${keywords}的${field}博士论文题目探析`,
        `${field}中${keywords}的理论与实践研究`,
        `面向${field}的${keywords}机制构建与验证`,
        `${method}视角下${keywords}的系统研究`,
        `${keywords}驱动的${field}创新路径研究`
      ]
    : [
        `A ${method} Study on ${keywords} in ${field}`,
        `${keywords}: A Framework for ${field} Innovation`,
        `Understanding ${keywords} Dynamics within ${field}`,
        `${field} Transformation Through ${keywords}`,
        `Evidence-Based Insights on ${keywords} in ${field}`
      ];
  return { titles };
}

function handleOutline(data) {
  const { isZh } = parseContext(data);
  return {
    sections: isZh
      ? ["引言", "文献综述", "研究设计", "数据与方法", "结果与讨论", "结论与展望"]
      : ["Introduction", "Literature Review", "Research Design", "Data & Methods", "Results & Discussion", "Conclusion"],
    logic: isZh
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

function handleDraft(data) {
  const { isZh, keywords, field, method } = parseContext(data);
  const draft = isZh
    ? `本节围绕${keywords}展开，首先阐明研究动机与理论背景，并指出${field}中的关键挑战。随后结合${method}提出研究框架，形成可验证的研究命题。\n\n通过对核心变量的分析，初步发现${keywords}在${field}场景中呈现出显著的结构性特征，为后续实证验证奠定基础。`
    : `This section focuses on ${keywords}. It outlines the motivation and theoretical background, highlighting the key challenges in ${field}. A ${method} framework is proposed to shape testable propositions.\n\nPreliminary analysis suggests that ${keywords} exhibit distinctive structural patterns in ${field}, setting the stage for empirical validation.`;
  return { draft };
}

function handlePolish(data) {
  const { isZh } = parseContext(data);
  const input = String(data.input || "").trim();
  const polished = isZh
    ? `润色建议：${input || "请输入需要润色的内容"}（已统一术语、优化逻辑衔接、提升学术表达）`
    : `Polished draft: ${input || "Provide the paragraph to polish."} (terminology aligned, flow improved, academic tone enhanced)`;
  return { polished };
}

function handleSearch(data) {
  const { isZh, keywords, field } = parseContext(data);
  return {
    results: [
      {
        title: isZh ? `${keywords}的最新研究综述` : `Recent Advances on ${keywords}`,
        year: 2023,
        source: "Journal of Research Insights"
      },
      {
        title: isZh ? `${field}中的${keywords}模型构建` : `${keywords} Modeling in ${field}`,
        year: 2022,
        source: "International Review"
      },
      {
        title: isZh ? `${keywords}的实证检验` : `Empirical Evidence of ${keywords}`,
        year: 2021,
        source: "Academic Reports"
      }
    ]
  };
}

function handleCitations(data) {
  const { isZh } = parseContext(data);
  const references = Array.isArray(data.references) ? data.references : [];
  const first = references[0]?.name || "Smith et al. (2023)";
  const second = references[1]?.name || "Li & Zhao (2022)";
  const citationBlock = isZh
    ? `建议引用：${first}；${second}`
    : `Suggested citations: ${first}; ${second}`;
  return { citationBlock };
}

function parseContext(data) {
  const project = data.project || {};
  const input = String(data.input || "");
  const language = String(project.language || "");
  const isZh = language === "zh" || /[\u4e00-\u9fff]/.test(input);
  const keywords = parseKeywords(project.keywords || input) || (isZh ? "关键主题" : "core topics");
  return {
    isZh,
    keywords,
    field: project.field || (isZh ? "研究领域" : "the field"),
    method: project.method || (isZh ? "研究方法" : "methodological")
  };
}

function parseKeywords(text) {
  if (!text) {
    return "";
  }
  const parts = String(text)
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return parts.length ? parts.slice(0, 3).join(" / ") : String(text).slice(0, 18);
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
