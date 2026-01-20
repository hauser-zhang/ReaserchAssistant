from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List

from fastapi import Body, FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency
    OpenAI = None

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

ROOT = Path(__file__).resolve().parent
PROMPT_PATH = ROOT / "prompts" / "prompts.json"

app = FastAPI()


def load_prompt_config() -> Dict[str, Any]:
    with PROMPT_PATH.open("r", encoding="utf-8") as handle:
        return json.load(handle)


PROMPTS = load_prompt_config()


@app.post("/api/topic")
def api_topic(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("topic", payload)


@app.post("/api/outline")
def api_outline(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("outline", payload)


@app.post("/api/draft")
def api_draft(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("draft", payload)


@app.post("/api/polish")
def api_polish(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("polish", payload)


@app.post("/api/search-refs")
def api_search(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("search", payload)


@app.post("/api/insert-refs")
def api_citations(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return handle_module("citations", payload)

@app.post("/api/models")
def api_models(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    return list_models(payload)


app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")


def handle_module(module_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    context = build_context(payload)
    if not context["model"]["api_key"] or not context["model"]["model"]:
        return build_error(
            context,
            "请先在首页配置 API Key 与模型 ID。",
            "Please configure the API key and model ID on the home page.",
        )
    if not context["reference_text"]:
        return build_error(
            context,
            "未检测到参考论文文本，请在资料库上传并完成文本提取。",
            "No reference text detected. Upload and extract reference papers in the Library.",
        )

    prompt = build_prompt(module_name, context)
    if not prompt:
        return build_error(context, "提示词生成失败。", "Failed to build the prompt.")

    try:
        raw = call_model(context["model"], prompt, context["system_prompt"])
        payload = parse_json_payload(raw)
        normalized = normalize_module_response(module_name, payload)
        if not normalized:
            return build_error(context, "模型返回格式不正确。", "The model returned invalid JSON.")
        return normalized
    except Exception:
        return build_error(context, "模型调用失败，请检查 API Key。", "Model call failed. Check your API key.")


def build_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    project = payload.get("project") or {}
    input_text = str(payload.get("input") or "")
    draft_text = str(payload.get("draftText") or "")
    references = payload.get("references") if isinstance(payload.get("references"), list) else []

    is_zh = project.get("language") == "zh" or bool(re.search(r"[\u4e00-\u9fff]", input_text + draft_text))
    language_key = "zh" if is_zh else "en"
    keywords = parse_list(project.get("keywords", ""))
    methods = parse_list(project.get("method", ""))

    reference_text = build_reference_text(references, 5000)
    reference_titles = "; ".join([ref.get("name", "") for ref in references if ref.get("name")])

    model_cfg = normalize_model(payload.get("model") or {})

    return {
        "language_key": language_key,
        "is_zh": is_zh,
        "project": project,
        "field": project.get("field") or ("研究领域" if is_zh else "the field"),
        "method": " / ".join(methods) or project.get("method") or ("研究方法" if is_zh else "methodology"),
        "keywords": " / ".join(keywords),
        "core_question": project.get("research") or "-",
        "target_venue": project.get("audience") or "-",
        "user_input": limit_text(input_text, 1200),
        "draft_text": limit_text(draft_text, 2000),
        "reference_titles": reference_titles or "-",
        "reference_text": limit_text(reference_text, 3500),
        "system_prompt": PROMPTS.get("system", {}).get(language_key, ""),
        "model": model_cfg,
    }


def build_prompt(module_name: str, context: Dict[str, Any]) -> str:
    module_cfg = PROMPTS.get("modules", {}).get(module_name, {})
    template = module_cfg.get(context["language_key"]) if module_cfg else None
    if not template:
        return ""
    return template.format(**context)


def normalize_model(model: Dict[str, Any]) -> Dict[str, Any]:
    provider = str(model.get("provider") or "gpt").lower()
    defaults = {
        "gpt": {"model": "gpt-5.1", "base_url": "https://api.openai.com/v1"},
        "deepseek": {"model": "deepseek-chat", "base_url": "https://api.deepseek.com/v1"},
        "gemini": {"model": "gemini-1.5-pro", "base_url": ""},
    }
    preset = defaults.get(provider, defaults["gpt"])
    return {
        "provider": provider,
        "model": model.get("model") or preset["model"],
        "api_key": model.get("apiKey") or "",
        "base_url": model.get("baseUrl") or preset["base_url"],
    }


def call_model(model: Dict[str, Any], prompt: str, system_prompt: str) -> str:
    provider = model["provider"]
    if provider == "gemini":
        return call_gemini(model, prompt, system_prompt)
    return call_openai_compatible(model, prompt, system_prompt)


def list_models(payload: Dict[str, Any]) -> Dict[str, Any]:
    model_cfg = normalize_model(payload.get("model") or payload)
    if not model_cfg["api_key"]:
        return {"models": [], "error": "Missing API key"}

    try:
        if model_cfg["provider"] == "gemini":
            return list_gemini_models(model_cfg)
        return list_openai_models(model_cfg)
    except Exception:
        return {"models": [], "error": "Failed to list models"}


def list_openai_models(model: Dict[str, Any]) -> Dict[str, Any]:
    if OpenAI is None:
        return {"models": [], "error": "openai SDK not installed"}
    client = OpenAI(api_key=model["api_key"], base_url=model["base_url"] or None)
    response = client.models.list()
    items = sorted({item.id for item in response.data if item.id})
    return {"models": [{"id": model_id, "label": model_id} for model_id in items]}


def list_gemini_models(model: Dict[str, Any]) -> Dict[str, Any]:
    if genai is None:
        return {"models": [], "error": "google-generativeai SDK not installed"}
    genai.configure(api_key=model["api_key"])
    models = []
    for item in genai.list_models():
        methods = set(getattr(item, "supported_generation_methods", []) or [])
        if "generateContent" not in methods:
            continue
        name = getattr(item, "name", "")
        if not name:
            continue
        model_id = name.split("/")[-1]
        models.append({"id": model_id, "label": model_id})
    models.sort(key=lambda entry: entry["id"])
    return {"models": models}

def call_openai_compatible(model: Dict[str, Any], prompt: str, system_prompt: str) -> str:
    if OpenAI is None:
        raise RuntimeError("openai SDK is not installed")
    client = OpenAI(api_key=model["api_key"], base_url=model["base_url"] or None)
    response = client.chat.completions.create(
        model=model["model"],
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        temperature=0.5,
        max_tokens=1200,
    )
    return response.choices[0].message.content or ""


def call_gemini(model: Dict[str, Any], prompt: str, system_prompt: str) -> str:
    if genai is None:
        raise RuntimeError("google-generativeai SDK is not installed")
    genai.configure(api_key=model["api_key"])
    gemini_model = genai.GenerativeModel(model_name=model["model"])
    response = gemini_model.generate_content(f"{system_prompt}\n\n{prompt}")
    return response.text or ""


def parse_json_payload(text: str) -> Dict[str, Any] | None:
    if not text:
        return None
    cleaned = re.sub(r"```json|```", "", text, flags=re.IGNORECASE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", cleaned)
        if not match:
            return None
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            return None


def normalize_module_response(module_name: str, payload: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None

    if module_name == "topic":
        titles = payload.get("titles") or payload.get("title") or []
        if isinstance(titles, str):
            titles = [titles]
        cleaned = [str(item).strip() for item in titles if str(item).strip()]
        return {"titles": cleaned[:8]} if cleaned else None

    if module_name == "outline":
        sections = payload.get("sections") or []
        logic = payload.get("logic") or []
        cleaned_sections = [str(item).strip() for item in sections if str(item).strip()]
        cleaned_logic = [str(item).strip() for item in logic if str(item).strip()]
        return {"sections": cleaned_sections, "logic": cleaned_logic} if cleaned_sections else None

    if module_name == "draft":
        draft = str(payload.get("draft") or "").strip()
        return {"draft": draft} if draft else None

    if module_name == "polish":
        polished = str(payload.get("polished") or "").strip()
        return {"polished": polished} if polished else None

    if module_name == "search":
        results = payload.get("results") or []
        cleaned = []
        for item in results:
            title = str(item.get("title") or "").strip()
            source = str(item.get("source") or "").strip()
            year = int(item.get("year") or 2023)
            if title and source:
                cleaned.append({"title": title, "year": year, "source": source})
        return {"results": cleaned} if cleaned else None

    if module_name == "citations":
        citation_block = str(payload.get("citationBlock") or "").strip()
        return {"citationBlock": citation_block} if citation_block else None

    return None


def build_reference_text(references: List[Dict[str, Any]], max_length: int) -> str:
    chunks: List[str] = []
    total = 0
    for ref in references:
        content = str(ref.get("content") or "").strip()
        if not content:
            continue
        label = f"Source: {ref.get('name')}\n" if ref.get("name") else ""
        snippet = re.sub(r"\s+", " ", content)[:1200]
        block = f"{label}{snippet}"
        if total + len(block) > max_length:
            remaining = max_length - total
            if remaining > 80:
                chunks.append(block[:remaining])
            break
        chunks.append(block)
        total += len(block)
    return "\n\n".join(chunks)


def parse_list(text: str) -> List[str]:
    if not text:
        return []
    return [item.strip() for item in re.split(r"[，,]", str(text)) if item.strip()]


def limit_text(text: str, max_length: int) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned if len(cleaned) <= max_length else f"{cleaned[:max_length]}..."


def build_error(context: Dict[str, Any], zh_message: str, en_message: str) -> Dict[str, Any]:
    return {"error": zh_message if context["is_zh"] else en_message}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8787, reload=False)
