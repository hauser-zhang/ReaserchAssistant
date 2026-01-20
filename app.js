
const STORAGE_KEYS = {
  language: "assistant.ui.language",
  project: "assistant.project.profile",
  library: "assistant.library.state",
  model: "assistant.model.config"
};

const modelPresets = {
  gpt: {
    label: "GPT 5.1",
    model: "gpt-5.1",
    baseUrl: "https://api.openai.com/v1"
  },
  gemini: {
    label: "Gemini",
    model: "gemini-1.5-pro",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta"
  },
  deepseek: {
    label: "DeepSeek",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1"
  }
};

const defaultProject = {
  field: "",
  method: "",
  keywords: "",
  language: "zh",
  research: "",
  audience: ""
};

const defaultLibrary = {
  references: [],
  citationFile: null,
  draftText: ""
};

const defaultModel = {
  provider: "gpt",
  model: modelPresets.gpt.model,
  apiKey: "",
  baseUrl: modelPresets.gpt.baseUrl
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

const i18n = {
  zh: {
    pageTitleHome: "博士论文智研助手",
    pageTitleProject: "项目设置",
    pageTitleLibrary: "资料库",
    pageTitleTopic: "题目生成",
    pageTitleOutline: "大纲梳理",
    pageTitleDraft: "初稿撰写",
    pageTitlePolish: "深度润色",
    pageTitleSearch: "文献检索",
    pageTitleCitations: "引用插入",
    brandTitle: "博士论文智研助手",
    brandTag: "Research Co-Pilot",
    navProject: "项目设置",
    navLibrary: "资料库",
    navTopic: "题目生成",
    navOutline: "大纲梳理",
    navDraft: "初稿撰写",
    navPolish: "深度润色",
    navSearch: "文献检索",
    navCitations: "引用插入",
    langToggle: "中文 / EN",
    heroEyebrow: "Research Workspace",
    heroTitle: "博士毕业论文的 AI 写作与文献协作中枢",
    heroSubtitle: "主界面保持清爽，选择模块后进入对应工作区，所有资料与模型配置统一管理。",
    heroActionSetup: "开始配置",
    heroActionModules: "进入模块",
    summaryTitle: "项目概览",
    summaryField: "研究领域",
    summaryMethod: "研究方法",
    summaryKeywords: "关键词",
    summaryLanguage: "写作语言",
    summaryRefs: "参考文献",
    summaryModel: "模型配置",
    summaryHint: "从项目设置与资料库开始，逐步完善研究工作流。",
    modelTitle: "模型与 API 配置",
    modelSubtitle: "选择后端大模型，并输入对应的 API 参数，后续模块调用将自动使用。",
    modelProviderLabel: "模型提供方",
    modelIdLabel: "模型 ID",
    modelApiKeyLabel: "API Key",
    modelBaseUrlLabel: "API Base URL (可选)",
    modelApiHint: "API Key 将仅保存在浏览器本地存储，不会写入仓库。",
    modelIdPlaceholder: "例如：gpt-5.1",
    modelApiKeyPlaceholder: "例如：sk-...",
    modelBaseUrlPlaceholder: "例如：https://api.openai.com/v1",
    quickStartTitle: "快速准备",
    quickStartStep1: "1. 在模型提供方控制台创建 API Key。",
    quickStartStep2: "2. 选择模型并填写对应的 Model ID 与 Base URL。",
    quickStartStep3: "3. 进入模块页面开始生成内容。",
    modelDefaultNote: "默认预设为 GPT 5.1，你可以随时切换。",
    modulesTitle: "功能模块",
    modulesSubtitle: "主界面仅展示入口，点击进入对应工作区。",
    moduleTopicTitle: "毕业论文题目生成",
    moduleTopicDesc: "结合草稿与研究信息，快速生成题目初稿。",
    moduleOutlineTitle: "大纲与写作逻辑梳理",
    moduleOutlineDesc: "构建章节结构与核心论证链条。",
    moduleDraftTitle: "初稿撰写",
    moduleDraftDesc: "生成章节段落草案，便于后续扩写。",
    modulePolishTitle: "深度润色",
    modulePolishDesc: "优化语言风格与学术表达。",
    moduleSearchTitle: "在线参考文献检索",
    moduleSearchDesc: "检索并整理核心文献线索。",
    moduleCitationsTitle: "文献插入建议",
    moduleCitationsDesc: "结合引用库生成插入建议。",
    projectTitle: "项目蓝图",
    projectSubtitle: "填写研究领域、方法与核心问题，为后续模块提供上下文。",
    fieldLabel: "研究领域",
    fieldPlaceholder: "例如：智能制造、教育技术",
    methodLabel: "研究方法",
    methodPlaceholder: "例如：实证研究、案例分析",
    keywordLabel: "关键词",
    keywordPlaceholder: "请输入 3-6 个关键词，用逗号分隔",
    writingLanguageLabel: "写作语言",
    writingLangZh: "中文",
    writingLangEn: "English",
    writingLangMix: "中英混合",
    researchLabel: "核心研究问题",
    researchPlaceholder: "描述核心研究问题、动机与创新点。",
    audienceLabel: "目标读者 / 投稿方向",
    audiencePlaceholder: "例如：IEEE / Nature",
    projectTagsLabel: "研究标签",
    projectStatus: "自动保存至本地。",
    libraryTitle: "参考文献与资料库",
    librarySubtitle: "上传论文、引用库与草稿文本，供题目生成与写作模块使用。",
    libraryPaperTitle: "上传参考论文",
    libraryPaperHint: "支持 PDF/Word/TXT。TXT 文件将提取摘要。",
    libraryCitationsTitle: "文献插入（Zotero / EndNote）",
    libraryCitationsHint: "导入 .bib / .ris / .enw 文件后，系统将识别引用并生成插入建议。",
    libraryDraftTitle: "上传或粘贴论文草稿",
    libraryDraftHint: "仅用于题目生成与后续写作模块的上下文分析。",
    libraryDraftPlaceholder: "粘贴你的草稿文本",
    libraryDraftSave: "保存草稿文本",
    topicTitle: "毕业论文题目生成",
    topicSubtitle: "结合项目设定、草稿文本与当前输入生成题目初稿。",
    topicInputLabel: "输入补充文本",
    topicInputPlaceholder: "输入研究方向或草稿段落",
    topicUseDraft: "引用草稿文本",
    topicGenerate: "生成题目",
    topicContextTitle: "当前上下文",
    topicContextHint: "将自动使用项目设置与资料库内容。",
    topicDraftStatusLabel: "草稿状态",
    outlineTitle: "大纲与写作逻辑梳理",
    outlineSubtitle: "输入研究问题或章节目标，输出结构化大纲。",
    outlineInputLabel: "输入研究问题",
    outlineInputPlaceholder: "输入研究问题或期望的章节结构",
    outlineGenerate: "生成大纲",
    draftTitle: "初稿撰写",
    draftSubtitle: "输入章节标题或关键点，生成段落草案。",
    draftInputLabel: "章节要点",
    draftInputPlaceholder: "输入章节标题或小节重点",
    draftGenerate: "生成初稿",
    polishTitle: "深度润色",
    polishSubtitle: "粘贴段落并生成学术化润色版本。",
    polishInputLabel: "待润色文本",
    polishInputPlaceholder: "粘贴需要润色的段落",
    polishGenerate: "开始润色",
    searchTitle: "在线参考文献检索",
    searchSubtitle: "输入关键词，生成检索结果概览。",
    searchInputLabel: "检索关键词",
    searchInputPlaceholder: "输入检索关键词或研究主题",
    searchGenerate: "检索文献",
    citationsTitle: "文献插入建议",
    citationsSubtitle: "输入段落，结合引用库生成插入建议。",
    citationsInputLabel: "上下文段落",
    citationsInputPlaceholder: "输入需要插入引用的段落",
    citationsGenerate: "生成引用",
    moduleContextTitle: "上下文",
    moduleContextHint: "自动使用项目设置与资料库内容作为生成依据。",
    footerText: "AI Assisted Dissertation Studio · Build research drafts iteratively.",
    statusNoReferences: "暂无上传内容",
    statusCitationEmpty: "未导入引用库",
    statusDraftEmpty: "未检测到草稿文本",
    statusDraftReady: "已加载草稿文本",
    statusDraftSaved: "草稿已保存到本地",
    statusWorking: "生成中...",
    statusUseDraft: "已插入草稿文本片段",
    downloadTxt: "下载 TXT",
    downloadDoc: "下载 Word"
  },
  en: {
    pageTitleHome: "Dissertation Research Assistant",
    pageTitleProject: "Project Setup",
    pageTitleLibrary: "Library",
    pageTitleTopic: "Title Generator",
    pageTitleOutline: "Outline Builder",
    pageTitleDraft: "Draft Writer",
    pageTitlePolish: "Deep Polish",
    pageTitleSearch: "Reference Search",
    pageTitleCitations: "Citation Insert",
    brandTitle: "Dissertation Research Assistant",
    brandTag: "Research Co-Pilot",
    navProject: "Project Setup",
    navLibrary: "Library",
    navTopic: "Title Generator",
    navOutline: "Outline Builder",
    navDraft: "Draft Writer",
    navPolish: "Deep Polish",
    navSearch: "Reference Search",
    navCitations: "Citation Insert",
    langToggle: "EN / 中文",
    heroEyebrow: "Research Workspace",
    heroTitle: "AI-assisted dissertation writing and literature workflow",
    heroSubtitle: "Keep the dashboard clean and jump into focused workspaces for each module.",
    heroActionSetup: "Configure",
    heroActionModules: "Open modules",
    summaryTitle: "Project Overview",
    summaryField: "Field",
    summaryMethod: "Method",
    summaryKeywords: "Keywords",
    summaryLanguage: "Writing Language",
    summaryRefs: "References",
    summaryModel: "Model",
    summaryHint: "Start with project setup and the library to build your workflow.",
    modelTitle: "Model & API Settings",
    modelSubtitle: "Pick a backend model and fill in the API details used by each module.",
    modelProviderLabel: "Provider",
    modelIdLabel: "Model ID",
    modelApiKeyLabel: "API Key",
    modelBaseUrlLabel: "API Base URL (optional)",
    modelApiHint: "API keys are stored locally in your browser only.",
    modelIdPlaceholder: "e.g. gpt-5.1",
    modelApiKeyPlaceholder: "e.g. sk-...",
    modelBaseUrlPlaceholder: "e.g. https://api.openai.com/v1",
    quickStartTitle: "Quick Start",
    quickStartStep1: "1. Create an API key in the provider console.",
    quickStartStep2: "2. Set the Model ID and Base URL for your provider.",
    quickStartStep3: "3. Open any module to start generating outputs.",
    modelDefaultNote: "Default preset is GPT 5.1. Change it anytime.",
    modulesTitle: "Modules",
    modulesSubtitle: "Only entry points are shown here. Open a module to work.",
    moduleTopicTitle: "Dissertation Title Generator",
    moduleTopicDesc: "Blend draft text and research context into title drafts.",
    moduleOutlineTitle: "Outline & Logic Builder",
    moduleOutlineDesc: "Shape chapters and argument structure.",
    moduleDraftTitle: "Draft Writer",
    moduleDraftDesc: "Generate paragraph drafts for sections.",
    modulePolishTitle: "Deep Polish",
    modulePolishDesc: "Refine academic tone and flow.",
    moduleSearchTitle: "Reference Search",
    moduleSearchDesc: "Generate a literature search overview.",
    moduleCitationsTitle: "Citation Suggestions",
    moduleCitationsDesc: "Insert references based on your library.",
    projectTitle: "Project Blueprint",
    projectSubtitle: "Capture field, method, and core questions for every module.",
    fieldLabel: "Research Field",
    fieldPlaceholder: "e.g. Smart manufacturing, education tech",
    methodLabel: "Methodology",
    methodPlaceholder: "e.g. Empirical study, case analysis",
    keywordLabel: "Keywords",
    keywordPlaceholder: "Enter 3-6 keywords, comma separated",
    writingLanguageLabel: "Writing Language",
    writingLangZh: "Chinese",
    writingLangEn: "English",
    writingLangMix: "Mixed",
    researchLabel: "Core Research Question",
    researchPlaceholder: "Describe the research question and contribution.",
    audienceLabel: "Target Audience / Venue",
    audiencePlaceholder: "e.g. IEEE / Nature",
    projectTagsLabel: "Research Tags",
    projectStatus: "Saved locally.",
    libraryTitle: "Reference Library",
    librarySubtitle: "Upload papers, citation files, and draft text for generation context.",
    libraryPaperTitle: "Upload Reference Papers",
    libraryPaperHint: "Supports PDF/Word/TXT. TXT will extract a snippet.",
    libraryCitationsTitle: "Citation Files (Zotero / EndNote)",
    libraryCitationsHint: "Import .bib / .ris / .enw files for citation suggestions.",
    libraryDraftTitle: "Upload or Paste Draft Text",
    libraryDraftHint: "Used for title generation and future writing modules.",
    libraryDraftPlaceholder: "Paste your draft text",
    libraryDraftSave: "Save draft text",
    topicTitle: "Dissertation Title Generator",
    topicSubtitle: "Use project settings, draft text, and current input to draft titles.",
    topicInputLabel: "Additional input",
    topicInputPlaceholder: "Add research notes or draft paragraphs",
    topicUseDraft: "Insert draft snippet",
    topicGenerate: "Generate titles",
    topicContextTitle: "Context",
    topicContextHint: "Project settings and library data are used automatically.",
    topicDraftStatusLabel: "Draft status",
    outlineTitle: "Outline & Logic Builder",
    outlineSubtitle: "Input research questions to generate a structured outline.",
    outlineInputLabel: "Research question",
    outlineInputPlaceholder: "Enter research questions or chapter goals",
    outlineGenerate: "Generate outline",
    draftTitle: "Draft Writer",
    draftSubtitle: "Generate draft paragraphs based on section goals.",
    draftInputLabel: "Section focus",
    draftInputPlaceholder: "Enter section titles or bullet points",
    draftGenerate: "Generate draft",
    polishTitle: "Deep Polish",
    polishSubtitle: "Refine paragraphs into academic writing.",
    polishInputLabel: "Text to polish",
    polishInputPlaceholder: "Paste the paragraph to polish",
    polishGenerate: "Polish",
    searchTitle: "Reference Search",
    searchSubtitle: "Enter keywords to generate a search overview.",
    searchInputLabel: "Search keywords",
    searchInputPlaceholder: "Enter search terms or topics",
    searchGenerate: "Search references",
    citationsTitle: "Citation Suggestions",
    citationsSubtitle: "Generate citation inserts based on your library.",
    citationsInputLabel: "Context paragraph",
    citationsInputPlaceholder: "Enter the paragraph for citation inserts",
    citationsGenerate: "Generate citations",
    moduleContextTitle: "Context",
    moduleContextHint: "Project settings and library data are used automatically.",
    footerText: "AI Assisted Dissertation Studio · Build research drafts iteratively.",
    statusNoReferences: "No uploads yet",
    statusCitationEmpty: "No citation library imported",
    statusDraftEmpty: "No draft text detected",
    statusDraftReady: "Draft text loaded",
    statusDraftSaved: "Draft saved locally",
    statusWorking: "Generating...",
    statusUseDraft: "Draft snippet inserted",
    downloadTxt: "Download TXT",
    downloadDoc: "Download Word"
  }
};

let currentLanguage = "zh";

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("loaded");
  setCardDelays();
  initLanguage();
  initPage();
});

function setCardDelays() {
  document.querySelectorAll(".card").forEach((card, index) => {
    card.style.setProperty("--delay", `${index * 0.06}s`);
  });
}

function initLanguage() {
  const stored = loadState(STORAGE_KEYS.language, "zh");
  setLanguage(stored, false);
  const toggle = document.querySelector("#langToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = currentLanguage === "zh" ? "en" : "zh";
      setLanguage(next, true);
    });
  }
}

function setLanguage(lang, persist) {
  currentLanguage = lang;
  if (persist) {
    saveState(STORAGE_KEYS.language, lang);
  }
  document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
  applyTranslations();
  refreshDynamicUI();
}

function t(key) {
  return (i18n[currentLanguage] && i18n[currentLanguage][key]) || i18n.zh[key] || key;
}

function applyTranslations() {
  const dict = i18n[currentLanguage] || i18n.zh;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
  document.querySelectorAll("[data-i18n-value]").forEach((el) => {
    const key = el.dataset.i18nValue;
    if (dict[key]) {
      el.value = dict[key];
    }
  });
}

function refreshDynamicUI() {
  const page = document.body.dataset.page || "";
  if (page === "home") {
    updateSummaryPanels();
  }
  if (page === "project") {
    updateTagList(loadProjectProfile());
  }
  if (page === "library") {
    const library = loadLibraryState();
    renderFileList(document.querySelector("#paperList"), library.references);
    renderCitationStatus(library);
    renderDraftStatus(library);
  }
  if (page === "topic") {
    updateTopicContext();
  }
  if (page === "module") {
    renderModuleContext();
  }
}

function initPage() {
  const page = document.body.dataset.page || "";
  if (page === "home") {
    initHome();
  }
  if (page === "project") {
    initProject();
  }
  if (page === "library") {
    initLibrary();
  }
  if (page === "topic") {
    initTopic();
  }
  if (page === "module") {
    initModulePage();
  }
  wireDownloadButtons();
  updateSummaryPanels();
}

function initHome() {
  const modelConfig = loadModelConfig();
  const providerSelect = document.querySelector("#modelProvider");
  const modelId = document.querySelector("#modelId");
  const apiKey = document.querySelector("#apiKey");
  const baseUrl = document.querySelector("#baseUrl");

  if (!providerSelect || !modelId || !apiKey || !baseUrl) {
    return;
  }

  providerSelect.value = modelConfig.provider;
  modelId.value = modelConfig.model;
  apiKey.value = modelConfig.apiKey;
  baseUrl.value = modelConfig.baseUrl;

  providerSelect.addEventListener("change", () => {
    modelConfig.provider = providerSelect.value;
    const preset = modelPresets[modelConfig.provider];
    if (preset) {
      modelConfig.model = preset.model;
      modelConfig.baseUrl = preset.baseUrl;
      modelId.value = preset.model;
      baseUrl.value = preset.baseUrl;
    }
    saveModelConfig(modelConfig);
    updateSummaryPanels();
  });

  modelId.addEventListener("input", () => {
    modelConfig.model = modelId.value.trim();
    saveModelConfig(modelConfig);
    updateSummaryPanels();
  });

  apiKey.addEventListener("input", () => {
    modelConfig.apiKey = apiKey.value.trim();
    saveModelConfig(modelConfig);
    updateSummaryPanels();
  });

  baseUrl.addEventListener("input", () => {
    modelConfig.baseUrl = baseUrl.value.trim();
    saveModelConfig(modelConfig);
  });
}

function initProject() {
  const project = loadProjectProfile();
  const fieldInput = document.querySelector("#fieldInput");
  const methodInput = document.querySelector("#methodInput");
  const keywordInput = document.querySelector("#keywordInput");
  const writingLanguage = document.querySelector("#writingLanguage");
  const researchInput = document.querySelector("#researchInput");
  const audienceInput = document.querySelector("#audienceInput");

  if (!fieldInput || !methodInput || !keywordInput || !writingLanguage || !researchInput || !audienceInput) {
    return;
  }

  fieldInput.value = project.field;
  methodInput.value = project.method;
  keywordInput.value = project.keywords;
  writingLanguage.value = project.language;
  researchInput.value = project.research;
  audienceInput.value = project.audience;

  const sync = () => {
    project.field = fieldInput.value.trim();
    project.method = methodInput.value.trim();
    project.keywords = keywordInput.value.trim();
    project.language = writingLanguage.value;
    project.research = researchInput.value.trim();
    project.audience = audienceInput.value.trim();
    saveProjectProfile(project);
    updateTagList(project);
    updateSummaryPanels();
  };

  fieldInput.addEventListener("input", sync);
  methodInput.addEventListener("input", sync);
  keywordInput.addEventListener("input", sync);
  writingLanguage.addEventListener("change", sync);
  researchInput.addEventListener("input", sync);
  audienceInput.addEventListener("input", sync);

  updateTagList(project);
}
function initLibrary() {
  const library = loadLibraryState();
  const paperUpload = document.querySelector("#paperUpload");
  const paperList = document.querySelector("#paperList");
  const citationUpload = document.querySelector("#citationUpload");
  const citationStatus = document.querySelector("#citationStatus");
  const draftUpload = document.querySelector("#draftUpload");
  const draftTextInput = document.querySelector("#draftTextInput");
  const saveDraft = document.querySelector("#saveDraft");
  const draftStatus = document.querySelector("#draftStatus");

  if (!paperUpload || !paperList || !citationUpload || !citationStatus || !draftUpload || !draftTextInput || !saveDraft || !draftStatus) {
    return;
  }

  renderFileList(paperList, library.references);
  renderCitationStatus(library);
  renderDraftStatus(library);
  draftTextInput.value = library.draftText.slice(0, 2000);

  paperUpload.addEventListener("change", () => {
    const files = Array.from(paperUpload.files || []);
    files.forEach((file) => registerReference(file, library, paperList));
    saveLibraryState(library);
    updateSummaryPanels();
  });

  citationUpload.addEventListener("change", () => {
    const file = citationUpload.files && citationUpload.files[0];
    if (!file) {
      library.citationFile = null;
    } else {
      library.citationFile = { name: file.name, size: file.size };
    }
    saveLibraryState(library);
    renderCitationStatus(library);
  });

  draftUpload.addEventListener("change", () => {
    const file = draftUpload.files && draftUpload.files[0];
    if (!file) {
      return;
    }
    readTextFile(file, (text) => {
      const cleaned = sanitizeText(text);
      library.draftText = cleaned.slice(0, 4000);
      draftTextInput.value = cleaned.slice(0, 2000);
      saveLibraryState(library);
      renderDraftStatus(library);
      updateSummaryPanels();
    });
  });

  saveDraft.addEventListener("click", () => {
    const text = sanitizeText(draftTextInput.value || "");
    library.draftText = text.slice(0, 4000);
    saveLibraryState(library);
    renderDraftStatus(library, t("statusDraftSaved"));
    updateSummaryPanels();
  });
}

function initTopic() {
  updateTopicContext();

  const topicInput = document.querySelector("#topicInput");
  const useDraft = document.querySelector("#useDraft");
  const output = document.querySelector("#topicOutput");

  if (useDraft && topicInput) {
    useDraft.addEventListener("click", () => {
      const library = loadLibraryState();
      if (!library.draftText) {
        topicInput.focus();
        return;
      }
      topicInput.value = buildDraftSnippet(library.draftText);
      const preview = document.querySelector("#draftPreview");
      if (preview) {
        preview.textContent = t("statusUseDraft");
      }
    });
  }

  wireModuleAction("topic", topicInput, output);
}

function initModulePage() {
  const moduleName = document.body.dataset.module || "";
  const input = document.querySelector("[data-input]");
  const output = document.querySelector("[data-output]");
  if (!moduleName || !input || !output) {
    return;
  }
  wireModuleAction(moduleName, input, output);
  renderModuleContext();
}

function wireModuleAction(moduleName, inputEl, outputEl) {
  const button = document.querySelector(`[data-action="${moduleName}"]`);
  if (!button || !inputEl || !outputEl) {
    return;
  }

  button.addEventListener("click", async () => {
    const project = loadProjectProfile();
    const library = loadLibraryState();
    const model = loadModelConfig();
    const input = (inputEl.value || "").trim();

    outputEl.textContent = t("statusWorking");

    const payload = {
      input,
      draftText: library.draftText,
      project,
      references: summarizeReferences(library.references),
      model
    };

    const data = await callApi(endpoints[moduleName], payload);
    const result = data || mockResponse(moduleName, payload);
    renderOutput(moduleName, outputEl, result);
    updateSummaryPanels();
  });
}

function wireDownloadButtons() {
  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", () => {
      const moduleCard = button.closest(".module");
      const output = moduleCard ? moduleCard.querySelector("[data-output]") : null;
      if (!output) {
        return;
      }
      const content = extractOutputText(output);
      if (!content) {
        return;
      }
      const moduleName = moduleCard.dataset.module || document.body.dataset.module || "module";
      downloadText(content, moduleName, button.dataset.download);
    });
  });
}

async function callApi(endpoint, payload) {
  if (!endpoint) {
    return null;
  }
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
    container.textContent = "";
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
    const list = document.createElement("ul");
    (data.sections || []).forEach((section) => {
      const li = document.createElement("li");
      li.textContent = section;
      list.appendChild(li);
    });
    container.appendChild(list);
    if (data.logic && data.logic.length) {
      const logicTitle = document.createElement("div");
      logicTitle.style.marginTop = "8px";
      logicTitle.textContent = currentLanguage === "zh" ? "逻辑脉络" : "Logic";
      container.appendChild(logicTitle);
      const logicList = document.createElement("ul");
      data.logic.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        logicList.appendChild(li);
      });
      container.appendChild(logicList);
    }
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

function extractOutputText(outputEl) {
  if (!outputEl) {
    return "";
  }
  const listItems = outputEl.querySelectorAll("li");
  if (listItems.length) {
    return Array.from(listItems).map((item) => item.textContent.trim()).join("\n");
  }
  const results = outputEl.querySelectorAll(".result");
  if (results.length) {
    return Array.from(results).map((item) => item.textContent.trim()).join("\n");
  }
  return outputEl.textContent.trim();
}

function downloadText(text, moduleName, format) {
  const safeName = moduleName || "module";
  const date = new Date().toISOString().slice(0, 10);
  const extension = format === "doc" ? "doc" : "txt";
  const filename = `${safeName}-${date}.${extension}`;
  let blob;

  if (format === "doc") {
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><pre>${escapeHtml(
      text
    )}</pre></body></html>`;
    blob = new Blob([html], { type: "application/msword" });
  } else {
    blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function mockResponse(moduleName, payload) {
  const isZh = isChineseMode(payload);
  const focus = buildFocus(payload, isZh);
  const field = payload.project.field || (isZh ? "研究领域" : "the field");
  const method = payload.project.method || (isZh ? "研究方法" : "methodological");

  if (moduleName === "topic") {
    const titles = isZh
      ? [
          `基于${focus}的${field}博士论文题目探析`,
          `${field}中${focus}的理论与实践研究`,
          `面向${field}的${focus}机制构建与验证`,
          `${method}视角下${focus}的系统研究`,
          `${focus}驱动的${field}创新路径研究`
        ]
      : [
          `A ${method} Study on ${focus} in ${field}`,
          `${focus}: A Framework for ${field} Innovation`,
          `Understanding ${focus} Dynamics within ${field}`,
          `${field} Transformation Through ${focus}`,
          `Evidence-Based Insights on ${focus} in ${field}`
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
      ? `本节围绕${focus}展开，首先阐明研究动机与理论背景，并指出${field}中的关键挑战。随后结合${method}提出研究框架，形成可验证的研究命题。\n\n通过对核心变量的分析，初步发现${focus}在${field}场景中呈现出显著的结构性特征，为后续实证验证奠定基础。`
      : `This section focuses on ${focus}. It outlines the motivation and theoretical background, highlighting the key challenges in ${field}. A ${method} framework is proposed to shape testable propositions.\n\nPreliminary analysis suggests that ${focus} exhibit distinctive structural patterns in ${field}, setting the stage for empirical validation.`;
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
          title: isZh ? `${focus}的最新研究综述` : `Recent Advances on ${focus}`,
          year: 2023,
          source: "Journal of Research Insights"
        },
        {
          title: isZh ? `${field}中的${focus}模型构建` : `${focus} Modeling in ${field}`,
          year: 2022,
          source: "International Review"
        },
        {
          title: isZh ? `${focus}的实证检验` : `Empirical Evidence of ${focus}`,
          year: 2021,
          source: "Academic Reports"
        }
      ]
    };
  }

  if (moduleName === "citations") {
    const references = payload.references || [];
    const first = references[0]?.name || "Smith et al. (2023)";
    const second = references[1]?.name || "Li & Zhao (2022)";
    const citationBlock = isZh
      ? `建议引用：${first}；${second}`
      : `Suggested citations: ${first}; ${second}`;
    return { citationBlock };
  }

  return { message: "Module not configured" };
}

function isChineseMode(payload) {
  const writingLanguage = payload.project.language || "";
  const input = payload.input || "";
  const draftText = payload.draftText || "";
  return writingLanguage === "zh" || /[\u4e00-\u9fff]/.test(input + draftText);
}

function buildFocus(payload, isZh) {
  const keywordList = parseKeywordList(payload.project.keywords || "");
  if (keywordList.length) {
    return keywordList.join(" / ");
  }
  const combined = payload.input || payload.draftText || "";
  const snippet = extractSnippet(combined, isZh);
  return snippet || (isZh ? "关键主题" : "core topics");
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
  const cleaned = sanitizeText(text);
  if (!cleaned) {
    return "";
  }
  if (isZh) {
    return cleaned.replace(/\s+/g, "").slice(0, 16);
  }
  return cleaned.split(/\s+/).slice(0, 6).join(" ");
}

function buildDraftSnippet(text) {
  if (!text) {
    return "";
  }
  const cleaned = sanitizeText(text);
  return cleaned.slice(0, 240);
}

function sanitizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}
function renderFileList(container, list) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!list || !list.length) {
    container.appendChild(renderFileItem(t("statusNoReferences")));
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

function renderCitationStatus(library) {
  const status = document.querySelector("#citationStatus");
  if (!status) {
    return;
  }
  status.innerHTML = "";
  if (!library.citationFile) {
    status.appendChild(renderFileItem(t("statusCitationEmpty")));
    return;
  }
  status.appendChild(
    renderFileItem(`${library.citationFile.name} (${formatBytes(library.citationFile.size)})`)
  );
}

function renderDraftStatus(library, message) {
  const status = document.querySelector("#draftStatus");
  if (!status) {
    return;
  }
  status.innerHTML = "";
  if (!library.draftText) {
    status.appendChild(renderFileItem(t("statusDraftEmpty")));
    return;
  }
  const label = message || t("statusDraftReady");
  status.appendChild(renderFileItem(label));
}

function updateTopicContext() {
  const project = loadProjectProfile();
  const library = loadLibraryState();
  const field = document.querySelector("#contextField");
  const method = document.querySelector("#contextMethod");
  const keywords = document.querySelector("#contextKeywords");
  const refs = document.querySelector("#contextRefs");
  const draft = document.querySelector("#contextDraft");
  const preview = document.querySelector("#draftPreview");

  if (field) field.textContent = project.field || "-";
  if (method) method.textContent = project.method || "-";
  if (keywords) keywords.textContent = project.keywords || "-";
  if (refs) refs.textContent = String(library.references.length || 0);
  if (draft) draft.textContent = library.draftText ? t("statusDraftReady") : t("statusDraftEmpty");
  if (preview) {
    preview.textContent = library.draftText ? buildDraftSnippet(library.draftText) : "";
  }
}

function renderModuleContext() {
  const container = document.querySelector("#moduleContext");
  if (!container) {
    return;
  }
  const project = loadProjectProfile();
  const library = loadLibraryState();
  const model = loadModelConfig();
  container.innerHTML = "";
  const items = [
    { label: t("summaryField"), value: project.field || "-" },
    { label: t("summaryMethod"), value: project.method || "-" },
    { label: t("summaryKeywords"), value: project.keywords || "-" },
    { label: t("summaryRefs"), value: String(library.references.length || 0) },
    { label: t("summaryModel"), value: buildModelLabel(model) }
  ];
  items.forEach((item) => {
    const block = document.createElement("div");
    const label = document.createElement("p");
    label.className = "label";
    label.textContent = item.label;
    const value = document.createElement("p");
    value.className = "value";
    value.textContent = item.value;
    block.appendChild(label);
    block.appendChild(value);
    container.appendChild(block);
  });
}

function updateSummaryPanels() {
  const project = loadProjectProfile();
  const library = loadLibraryState();
  const model = loadModelConfig();

  setText("summaryField", project.field || "-");
  setText("summaryMethod", project.method || "-");
  setText("summaryKeywords", project.keywords || "-");
  setText("summaryLanguage", formatWritingLanguage(project.language));
  setText("summaryRefs", String(library.references.length || 0));
  setText("summaryModel", buildModelLabel(model));

  updateProgressBar(project, library, model);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function updateProgressBar(project, library, model) {
  const bar = document.querySelector("#progressBar");
  if (!bar) {
    return;
  }
  let progress = 12;
  if (project.field) progress += 12;
  if (project.method) progress += 8;
  if (project.keywords) progress += 10;
  if (library.references.length > 0) progress += 12;
  if (library.draftText) progress += 10;
  if (model.apiKey) progress += 16;
  bar.style.width = `${Math.min(progress, 100)}%`;
}

function updateTagList(project) {
  const tagList = document.querySelector("#tagList");
  if (!tagList) {
    return;
  }
  tagList.innerHTML = "";
  const tags = parseKeywordList(project.keywords || "");
  if (!tags.length && project.field) {
    tags.push(project.field);
  }
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagList.appendChild(span);
  });
}

function registerReference(file, library, listContainer) {
  const record = {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
    snippet: ""
  };

  if (file.type === "text/plain" || file.name.endsWith(".txt")) {
    readTextFile(file, (text) => {
      record.snippet = sanitizeText(text).slice(0, 240);
      renderFileList(listContainer, library.references);
    });
  }

  library.references.unshift(record);
  renderFileList(listContainer, library.references);
}

function readTextFile(file, onLoad) {
  const reader = new FileReader();
  reader.onload = () => {
    onLoad(String(reader.result || ""));
  };
  reader.readAsText(file);
}

function summarizeReferences(references) {
  return (references || []).slice(0, 6).map((ref) => ({
    name: ref.name,
    size: ref.size
  }));
}

function buildModelLabel(model) {
  const preset = modelPresets[model.provider];
  const label = preset ? preset.label : model.provider || "";
  return model.model ? `${label} · ${model.model}` : label || "-";
}

function formatWritingLanguage(language) {
  if (language === "en") {
    return t("writingLangEn");
  }
  if (language === "mix") {
    return t("writingLangMix");
  }
  return t("writingLangZh");
}

function loadProjectProfile() {
  const data = loadState(STORAGE_KEYS.project, defaultProject);
  return { ...defaultProject, ...data };
}

function saveProjectProfile(profile) {
  saveState(STORAGE_KEYS.project, profile);
}

function loadLibraryState() {
  const data = loadState(STORAGE_KEYS.library, defaultLibrary);
  return { ...defaultLibrary, ...data };
}

function saveLibraryState(state) {
  saveState(STORAGE_KEYS.library, state);
}

function loadModelConfig() {
  const data = loadState(STORAGE_KEYS.model, defaultModel);
  return { ...defaultModel, ...data };
}

function saveModelConfig(config) {
  saveState(STORAGE_KEYS.model, config);
}

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function saveState(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore localStorage failures.
  }
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
