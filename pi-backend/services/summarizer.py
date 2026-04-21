import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3:8b")
OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL: str = os.getenv(
    "OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free"
)

LANGUAGE_NAMES = {
    "en": "English",
    "fr": "French",
}

PROMPT_TEMPLATE = """\
You are an expert assistant for professional meeting summarisation.
Here is the transcript of a meeting:

---
{transcript}
---

Generate a structured Markdown meeting report with the following sections:
## Summary (2-3 sentences)
## Identified Participants
## Decisions Made
## Action Items (with owner if mentioned)
## Open Questions

Be concise and factual. Use bullet points.
You MUST write your entire response in {language}. Do NOT use any other language.\
"""


class SummarizerService:
    """Summarizer using OpenRouter (primary) or local Ollama (fallback)."""

    async def summarize(self, transcript: str, language: str = "en") -> str:
        """
        Generate a structured Markdown summary from the transcript.
        Prioritizes OpenRouter if API key is present, otherwise uses local Ollama.
        """
        # 1. Try OpenRouter first if key is present
        if OPENROUTER_API_KEY:
            try:
                logger.info(
                    "SummarizerService: Attempting summarization with OpenRouter (%s) in %s",
                    OPENROUTER_MODEL,
                    language,
                )
                return await self._summarize_openrouter(transcript, language)
            except Exception as ore:
                logger.error("SummarizerService: OpenRouter failed: %s", ore)
                if not OLLAMA_URL:
                    raise RuntimeError(f"OpenRouter failed and Ollama is not configured. Error: {ore}") from ore
                logger.info("SummarizerService: Falling back to local Ollama")
        
        # 2. Try Ollama (primary if no OR key, or fallback)
        try:
            logger.info(
                "SummarizerService: Attempting summarization with local Ollama (%s) in %s",
                OLLAMA_MODEL,
                language,
            )
            return await self._summarize_ollama(transcript, language)
        except Exception as e:
            logger.error("SummarizerService: Ollama failed: %s", e)
            raise RuntimeError(f"Summarization failed. Ollama error: {e}") from e

    async def _summarize_ollama(self, transcript: str, language: str = "en") -> str:
        """Ollama specific implementation."""
        lang_name = LANGUAGE_NAMES.get(language, "English")
        prompt = PROMPT_TEMPLATE.format(transcript=transcript, language=lang_name)
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=300) as client:
            try:
                response = await client.post(
                    f"{OLLAMA_URL}/api/generate",
                    json=payload,
                )
                response.raise_for_status()
            except httpx.TimeoutException as exc:
                raise RuntimeError("Ollama request timed out after 300s") from exc
            except httpx.HTTPStatusError as exc:
                raise RuntimeError(
                    f"Ollama API error {exc.response.status_code}: {exc.response.text}"
                ) from exc
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot reach Ollama at {OLLAMA_URL}: {exc}") from exc

        data: dict[str, object] = response.json()
        summary = data.get("response")
        if not isinstance(summary, str) or not summary.strip():
            raise RuntimeError(f"Unexpected Ollama response format: {data}")
        return summary.strip()

    async def _summarize_openrouter(self, transcript: str, language: str = "en") -> str:
        """OpenRouter specific implementation."""
        lang_name = LANGUAGE_NAMES.get(language, "English")
        prompt = PROMPT_TEMPLATE.format(transcript=transcript, language=lang_name)
        
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://meetingpi.local", # Optional
            "X-Title": "MeetingPi", # Optional
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        async with httpx.AsyncClient(timeout=60) as client:
            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise RuntimeError(
                    f"OpenRouter API error {exc.response.status_code}: {exc.response.text}"
                ) from exc
            except httpx.RequestError as exc:
                raise RuntimeError(f"Cannot reach OpenRouter: {exc}") from exc

        data = response.json()
        try:
            summary = data["choices"][0]["message"]["content"]
            return summary.strip()
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected OpenRouter response format: {data}") from e

    async def list_models(self) -> list[str]:
        """Return the list of models available in Ollama."""
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                response = await client.get(f"{OLLAMA_URL}/api/tags")
                response.raise_for_status()
            except (httpx.RequestError, httpx.HTTPStatusError):
                return []

        data = response.json()
        models: list[dict[str, object]] = data.get("models", [])
        return [str(m.get("name", "")) for m in models if m.get("name")]

    async def is_available(self) -> bool:
        """Check if Ollama or OpenRouter is reachable."""
        # Ollama check
        async with httpx.AsyncClient(timeout=5) as client:
            try:
                response = await client.get(f"{OLLAMA_URL}/api/tags")
                if response.status_code == 200:
                    return True
            except (httpx.RequestError, httpx.HTTPStatusError):
                pass
        
        # Fallback check for OpenRouter
        return bool(OPENROUTER_API_KEY)


# Module-level singleton
_summarizer_service = SummarizerService()


def get_summarizer_service() -> SummarizerService:
    """FastAPI dependency that returns the SummarizerService singleton."""
    return _summarizer_service
