const state = {
  project: {
    field: "",
    method: "",
    keywords: "",
    language: "zh",
    research: "",
    audience: ""
  },
  references: [],
  citationFile: null
};

const apiBase = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || "";

const endpoints = {
  topic: "/api/topic",
  outline: "/api/outline",
  draft: "/api/draft",
  polish: "/api/polish",
  search: "/api/search-refs",
  citations: "/api/insert-refs"
};

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");
  setCardDelays();
  wireProjectInputs();
  wireUploaders();
  wireModules();
  wireScrollButtons();
  updateSummary();
});

function setCardDelays() {
  document.querySelectorAll(".card").forEach((card, index) => {
    card.style.setProperty("--delay", `${index * 0.06}s`);
  });
}

function wireProjectInputs() {
  const fieldInput = document.querySelector("#fieldInput");
  const methodInput = document.querySelector("#methodInput");
  const keywordInput = document.querySelector("#keywordInput");
  const languageSelect = document.querySelector("#languageSelect");
  const researchInput = document.querySelector("#researchInput");
  const audienceInput = document.querySelector("#audienceInput");

  fieldInput.addEventListener("input", () => {
    state.project.field = fieldInput.value.trim();
    updateSummary();
  });
  methodInput.addEventListener("input", () => {
    state.project.method = methodInput.value.trim();
    updateSummary();
  });
  keywordInput.addEventListener("input", () => {
    state.project.keywords = keywordInput.value.trim();
    updateSummary();
  });
  languageSelect.addEventListener("change", () => {
    state.project.language = languageSelect.value;
    updateSummary();
  });
  researchInput.addEventListener("input", () => {
    state.project.research = researchInput.value.trim();
  });
  audienceInput.addEventListener("input", () => {
    state.project.audience = audienceInput.value.trim();
  });
}

function wireUploaders() {
  const paperUpload = document.querySelector("#paperUpload");
  const paperList = document.querySelector("#paperList");
  const citationUpload = document.querySelector("#citationUpload");
  const citationStatus = document.querySelector("#citationStatus");

  paperUpload.addEventListener("change", () => {
    const files = Array.from(paperUpload.files || []);
    files.forEach((file) => registerReference(file));
    renderFileList(paperList, state.references);
    updateSummary();
  });

  citationUpload.addEventListener("change", () => {
    const file = citationUpload.files && citationUpload.files[0];
    if (!file) {
      state.citationFile = null;
      citationStatus.innerHTML = "";
      return;
    }
    state.citationFile = { name: file.name, size: file.size };
    citationStatus.innerHTML = "";
    citationStatus.appendChild(renderFileItem(`${file.name} (${formatBytes(file.size)}) 已导入`));
  });
}

function registerReference(file) {
  const record = {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    snippet: ""
  };

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    const reader = new FileReader();
    reader.onload = () => {
      record.snippet = String(reader.result || "").slice(0, 240);
      renderFileList(document.querySelector("#paperList"), state.references);
    };
    reader.readAsText(file);
  }

  state.references.unshift(record);
}

function renderFileList(container, list) {
  container.innerHTML = "";
  if (!list.length) {
    container.appendChild(renderFileItem("暂无上传内容"));
    return;
  }
  list.forEach((item) => {
    const text = `${item.name} (${formatBytes(item.size)})`;
    const node = renderFileItem(text, item.snippet);
    container.appendChild(node);
  });
}

function renderFileItem(title, snippet) {
  const wrapper = document.createElement("div");
  wrapper.className = "file-item";
  const strong = document.createElement("div");
  strong.textContent = title;
  wrapper.appendChild(strong);
  if (snippet) {
    const small = document.createElement("p");
    small.textContent = snippet + "...";
    wrapper.appendChild(small);
  }
  return wrapper;
}

function wireModules() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const moduleName = button.dataset.action;
      const moduleCard = button.closest(".module");
      const input = moduleCard.querySelector("[data-input]").value.trim();
      const output = moduleCard.querySelector("[data-output]");
      output.textContent = "生成中...";

      const payload = {
        input,
        project: { ...state.project },
        references: summarizeReferences()
      };

      const data = await callApi(endpoints[moduleName], payload);
      const result = data || mockResponse(moduleName, payload);
      renderOutput(moduleName, output, result);
      updateProgress();
    });
  });
}

function wireScrollButtons() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
}

async function callApi(endpoint, payload) {
  try {
    const response = await fetch(`${apiBase}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

function renderOutput(moduleName, container, data) {
  container.innerHTML = "";
  if (!data) {
    container.textContent = "暂无输出";
    return;
  }

  if (moduleName === "topic") {
    const list = document.createElement("ul");
    (data.titles || []).forEach((title) => {
      const li = document.createElement("li");
      li.textContent = title;
      list.appendChild(li);
    });
    container.appendChild(list);
    return;
  }

  if (moduleName === "outline") {
    const title = document.createElement("div");
    title.textContent = "章节结构";
    container.appendChild(title);
    const list = document.createElement("ul");
    (data.sections || []).forEach((section) => {
      const li = document.createElement("li");
      li.textContent = section;
      list.appendChild(li);
    });
    container.appendChild(list);
    const logicTitle = document.createElement("div");
    logicTitle.style.marginTop = "8px";
    logicTitle.textContent = "逻辑脉络";
    container.appendChild(logicTitle);
    const logicList = document.createElement("ul");
    (data.logic || []).forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      logicList.appendChild(li);
    });
    container.appendChild(logicList);
    return;
  }

  if (moduleName === "search") {
    (data.results || []).forEach((result) => {
      const block = document.createElement("div");
      block.className = "result";
      block.textContent = `${result.title} (${result.year}) - ${result.source}`;
      container.appendChild(block);
    });
    return;
  }

  const text = data.draft || data.polished || data.citationBlock || data.message || "";
  container.textContent = text;
}

function mockResponse(moduleName, payload) {
  const isZh = isChineseMode(payload);
  const keywords = buildKeywords(payload);
  const field = payload.project.field || (isZh ? "研究领域" : "the field");
  const method = payload.project.method || (isZh ? "研究方法" : "methodological");

  if (moduleName === "topic") {
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

  if (moduleName === "outline") {
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

  if (moduleName === "draft") {
    const draft = isZh
      ? `本节围绕${keywords}展开，首先阐明研究动机与理论背景，并指出${field}中的关键挑战。随后结合${method}提出研究框架，形成可验证的研究命题。\n\n通过对核心变量的分析，初步发现${keywords}在${field}场景中呈现出显著的结构性特征，为后续实证验证奠定基础。`
      : `This section focuses on ${keywords}. It outlines the motivation and theoretical background, highlighting the key challenges in ${field}. A ${method} framework is proposed to shape testable propositions.\n\nPreliminary analysis suggests that ${keywords} exhibit distinctive structural patterns in ${field}, setting the stage for empirical validation.`;
    return { draft };
  }

  if (moduleName === "polish") {
    const polished = isZh
      ? `润色建议：${payload.input || "请输入需要润色的内容"}（已统一术语、优化逻辑衔接、提升学术表达）`
      : `Polished draft: ${payload.input || "Provide the paragraph to polish."} (terminology aligned, flow improved, academic tone enhanced)`;
    return { polished };
  }

  if (moduleName === "search") {
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

  if (moduleName === "citations") {
    const citationBlock = isZh
      ? `建议引用：${state.references[0]?.name || "Smith et al. (2023)"}；${state.references[1]?.name || "Li & Zhao (2022)"}`
      : `Suggested citations: ${state.references[0]?.name || "Smith et al. (2023)"}; ${state.references[1]?.name || "Li & Zhao (2022)"}`;
    return { citationBlock };
  }

  return { message: "模块尚未配置" };
}

function isChineseMode(payload) {
  const language = payload.project.language || "";
  const input = payload.input || "";
  return language === "zh" || /[\u4e00-\u9fff]/.test(input);
}

function buildKeywords(payload) {
  const keywords = payload.project.keywords
    ? payload.project.keywords.split(/[，,]/).map((item) => item.trim()).filter(Boolean)
    : [];
  if (keywords.length) {
    return keywords.slice(0, 3).join(" / ");
  }
  return payload.input ? payload.input.slice(0, 18) : "关键主题";
}

function summarizeReferences() {
  return state.references.slice(0, 6).map((ref) => ({
    name: ref.name,
    size: ref.size
  }));
}

function updateSummary() {
  const tagList = document.querySelector("#tagList");
  const langStatus = document.querySelector("#langStatus");
  const refCount = document.querySelector("#refCount");

  tagList.innerHTML = "";
  const tags = buildKeywords({ project: state.project, input: "" }).split("/");
  tags.forEach((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) {
      return;
    }
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = trimmed;
    tagList.appendChild(span);
  });

  const languageText = state.project.language === "en" ? "English" : state.project.language === "mix" ? "中英混合" : "中文";
  langStatus.textContent = `${languageText} / Research`;
  refCount.textContent = `${state.references.length} 篇`;
}

function updateProgress() {
  const progressBar = document.querySelector("#progressBar");
  const totalModules = document.querySelectorAll(".module").length;
  const filledOutputs = Array.from(document.querySelectorAll(".module [data-output]")).filter(
    (node) => node.textContent && node.textContent.trim().length > 0
  ).length;
  const progress = Math.min(100, Math.max(8, Math.round((filledOutputs / totalModules) * 100)));
  progressBar.style.width = `${progress}%`;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)}${units[index]}`;
}
