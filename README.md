# AI Assisted Dissertation Studio

面向博士毕业论文写作的 AI 辅助项目。当前版本提供科研风格 UI 与模块化写作流程，后端为本地 mock 接口，便于后续接入真实大模型能力。

## 功能概览

- 科研风格前端 UI（响应式、模块化流程）
- 论文/资料上传（中英文皆可，支持 TXT 预览）
- 题目生成、大纲与逻辑梳理、初稿撰写、深度润色
- 在线参考文献检索（mock 数据，可对接 Crossref/Google Scholar）
- Zotero / EndNote 引用插入（mock 建议，后续接入解析器）

## 本地运行

确保安装 Node.js（>=16），在项目根目录执行：

```bash
node server.js
```

访问：`http://localhost:8787`

## 项目结构

- `index.html`：主页面
- `styles.css`：视觉样式
- `app.js`：前端逻辑（模块交互 + mock 回退）
- `server.js`：轻量 Node 服务（静态资源 + mock API）

## Git 初始化与关联 GitHub 仓库

```bash
git init
git add .
git commit -m "Initial dissertation assistant skeleton"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

如果你把仓库地址发给我，我也可以直接帮你完成 `git remote` 配置。

## 部署建议

1. **前端静态部署（仅展示 UI + mock）**
   - 将 `index.html`、`styles.css`、`app.js` 发布到 GitHub Pages 或 Netlify。
   - 适用于展示原型与 UI。

2. **完整部署（包含 mock API / 未来接入 AI）**
   - 使用 Render / Railway / Fly.io 部署 Node 服务。
   - 启动命令：`node server.js`。
   - 部署后可在 `index.html` 中设置 `window.APP_CONFIG.apiBase` 指向你的域名。

## 下一步建议

- 接入真实大模型（OpenAI / Claude / 本地模型）
- 文献检索接入 Crossref / Semantic Scholar
- Zotero / EndNote 文件解析（BibTeX / RIS）
- 多用户登录与项目存储
