# AI Assisted Dissertation Studio

An AI-assisted workspace for dissertation writing and literature management. This version provides a research-focused UI, multi-page modules, and mock API responses to support iterative development.

## Features

- Research-style UI with dedicated pages per module
- Upload English/Chinese papers as references
- Extract reference text from PDF/DOCX/TXT in the Library
- Title generation, outline planning, drafting, polishing, literature search, citation insertion
- Zotero / EndNote citation file intake (BibTeX / RIS / ENW)
- Chinese/English UI toggle
- Model provider selection (GPT 5.1, Gemini, DeepSeek) with local API configuration
- Module outputs downloadable as TXT or Word-compatible DOC

## Pages

- `index.html`: dashboard with model settings and module entry points
- `project.html`: project context (field, method, keywords, writing language)
- `library.html`: reference uploads, citation files, draft text input
- `topic.html`: title generation based on context + draft text
- `outline.html`, `draft.html`, `polish.html`, `search.html`, `citations.html`: module workspaces

## Run Locally (Python Backend)

Install Python 3.10+ and run:

```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r requirements.txt
python server.py
```

Open: `http://localhost:8787`

The Python backend handles all model calls. The legacy `server.js` is now static-only and will not execute model requests.

## Model Configuration

On the home page, select a provider and set:

- **Model ID** (e.g. `gpt-5.1`, `gemini-1.5-pro`, `deepseek-chat`)
- **API Key** (required)
- **API Base URL** (optional; defaults are prefilled)

API keys are stored in browser localStorage and are not written to the repository. The Python server uses the provided key to call the selected model provider at request time.

## Reference Text Requirement

Generation modules rely on extracted reference text. Upload PDFs/DOCX/TXT in `library.html` and wait for extraction to complete before running a module. If no reference text is available, the server will return an error.

PDF/DOCX extraction uses browser libraries (`pdfjs-dist`, `mammoth`) loaded from CDN at runtime.

## Prompt Configuration

Module prompts live in `prompts/prompts.json` with Chinese and English variants. Update these templates to adjust instructions or output schemas.

### Getting API Keys

- **OpenAI (GPT)**: Go to `https://platform.openai.com/api-keys` and create a key.
- **Gemini**: Create a key in Google AI Studio: `https://aistudio.google.com/app/apikey`.
- **DeepSeek**: Create a key in the DeepSeek console: `https://platform.deepseek.com/`.

## Notes

- No automated tests are configured yet.
- Mock responses are used until real model integrations are wired up.
- For production use, add authentication and rate limiting.
