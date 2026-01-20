# Repository Guidelines

## Project Structure & Module Organization
This repository is a lightweight multi-page UI with a Python backend.
- `index.html`: dashboard with model settings and module entry points.
- `project.html`, `library.html`: project context and reference uploads.
- `topic.html`, `outline.html`, `draft.html`, `polish.html`, `search.html`, `citations.html`: module workspaces.
- `styles.css`: visual theme and layout styling.
- `app.js`: frontend logic (i18n, storage, uploads, mock outputs).
- `server.py`: FastAPI server serving static files and model API calls.
- `prompts/prompts.json`: bilingual prompt templates per module.
- `README.md`: usage and deployment notes.

There is no separate `src/` directory or tests folder yet. Assets are embedded in the CSS/HTML.

## Build, Test, and Development Commands
- `python server.py`: run the FastAPI server at `http://localhost:8787`.
- `git status`: verify working tree changes before committing.

There is no build step or package manager script at this stage.

## Coding Style & Naming Conventions
- Indentation: 2 spaces for HTML/CSS/JS.
- Use `camelCase` for JS variables/functions and `kebab-case` for CSS classes.
- Keep UI labels concise; prefer explicit IDs (e.g., `#paperUpload`, `#progressBar`).
- No formatter or linter is configured yet.

## Testing Guidelines
No automated tests are configured. If you add tests, prefer a `/tests` directory and name files like `*.test.js`. Document new commands in `README.md`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (e.g., `feat: add mock endpoints`).
- Keep commits scoped and descriptive.
- PRs should include: a short summary, linked issue (if any), and UI screenshots for visual changes.

## Security & Configuration Tips
- The server is a local dev mock; do not expose it publicly without adding authentication and rate limiting.
- Store API keys in `.env` if you add real AI or search integrations.
