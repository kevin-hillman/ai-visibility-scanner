import asyncio
import time
from typing import Any

import httpx
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import google.generativeai as genai

from app.config import Settings


class LLMClient:
    """Client für parallele Queries an ChatGPT, Claude, Gemini, Perplexity."""

    def __init__(self, settings: Settings):
        """
        Initialisiert API-Clients für alle Plattformen.

        Args:
            settings: Settings-Objekt mit API-Keys
        """
        self.settings = settings

        # OpenAI Client
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

        # Anthropic Client
        self.anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None

        # Google Gemini (sync API, wird in executor wrapped)
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)

        # Perplexity (HTTP Client)
        self.perplexity_api_key = settings.PERPLEXITY_API_KEY

        # System Prompt für alle Plattformen
        self.system_prompt = (
            "Du bist ein hilfreicher Assistent. Beantworte die folgende Frage "
            "ausführlich und nenne konkrete Unternehmen/Anbieter wenn möglich."
        )

    async def query_platform(
        self,
        platform: str,
        query: str,
        model: str
    ) -> dict[str, Any]:
        """
        Sendet eine Query an eine spezifische Plattform.

        Args:
            platform: Name der Plattform (chatgpt, claude, gemini, perplexity)
            query: Die zu stellende Frage
            model: Model-ID für die Plattform

        Returns:
            Dictionary mit Ergebnis und Metadaten
        """
        start_time = time.time()

        try:
            if platform == "chatgpt":
                response_text = await self._query_chatgpt(query, model)
            elif platform == "claude":
                response_text = await self._query_claude(query, model)
            elif platform == "gemini":
                response_text = await self._query_gemini(query, model)
            elif platform == "perplexity":
                response_text = await self._query_perplexity(query, model)
            else:
                raise ValueError(f"Unbekannte Plattform: {platform}")

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                "platform": platform,
                "query": query,
                "model": model,
                "response_text": response_text,
                "success": True,
                "error": None,
                "latency_ms": latency_ms,
            }

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)

            return {
                "platform": platform,
                "query": query,
                "model": model,
                "response_text": "",
                "success": False,
                "error": str(e),
                "latency_ms": latency_ms,
            }

    async def query_all_platforms(
        self,
        query: str,
        platforms: dict[str, dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """
        Queries alle Plattformen parallel.

        Args:
            query: Die zu stellende Frage
            platforms: Dict mit platform -> {model, weight} aus Industry Config

        Returns:
            Liste von Ergebnis-Dictionaries
        """
        tasks = []
        attempted_platforms: list[str] = []

        for platform_name, platform_config in platforms.items():
            model = platform_config.get("model", "")

            # Überspringe Plattform wenn kein API-Key vorhanden
            if not self._has_api_key(platform_name):
                continue

            task = self.query_platform(platform_name, query, model)
            tasks.append(task)
            attempted_platforms.append(platform_name)

        # Parallel ausführen mit 60s Timeout
        timeout_s = 60.0
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=timeout_s
            )
        except asyncio.TimeoutError:
            results = [
                {
                    "platform": p,
                    "query": query,
                    "model": platforms[p].get("model", ""),
                    "response_text": "",
                    "success": False,
                    "error": f"Timeout nach {int(timeout_s)}s",
                    "latency_ms": int(timeout_s * 1000),
                }
                for p in attempted_platforms
            ]

        # Filter exceptions
        processed_results = []
        for result in results:
            if isinstance(result, dict):
                processed_results.append(result)
            elif isinstance(result, Exception):
                # Exception wurde von gather() returned
                processed_results.append({
                    "platform": "unknown",
                    "query": query,
                    "model": "",
                    "response_text": "",
                    "success": False,
                    "error": str(result),
                    "latency_ms": 0,
                })

        return processed_results

    def _has_api_key(self, platform: str) -> bool:
        """Prüft ob API-Key für Plattform vorhanden ist."""
        if platform == "chatgpt":
            return bool(self.settings.OPENAI_API_KEY)
        elif platform == "claude":
            return bool(self.settings.ANTHROPIC_API_KEY)
        elif platform == "gemini":
            return bool(self.settings.GOOGLE_API_KEY)
        elif platform == "perplexity":
            return bool(self.perplexity_api_key)
        return False

    async def _query_chatgpt(self, query: str, model: str) -> str:
        """
        Query an OpenAI ChatGPT.

        Args:
            query: Frage
            model: Model-ID (z.B. "gpt-4o")

        Returns:
            Response-Text
        """
        if not self.openai_client:
            raise ValueError("OpenAI API Key nicht konfiguriert")

        response = await self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        return response.choices[0].message.content or ""

    async def _query_claude(self, query: str, model: str) -> str:
        """
        Query an Anthropic Claude.

        Args:
            query: Frage
            model: Model-ID (z.B. "claude-sonnet-4-5-20250929")

        Returns:
            Response-Text
        """
        if not self.anthropic_client:
            raise ValueError("Anthropic API Key nicht konfiguriert")

        message = await self.anthropic_client.messages.create(
            model=model,
            max_tokens=1000,
            system=self.system_prompt,
            messages=[
                {"role": "user", "content": query}
            ],
        )

        # Extrahiere Text aus Content-Blocks
        text_blocks = [
            block.text for block in message.content
            if hasattr(block, "text")
        ]

        return " ".join(text_blocks)

    async def _query_gemini(self, query: str, model: str) -> str:
        """
        Query an Google Gemini.

        Args:
            query: Frage
            model: Model-ID (z.B. "gemini-2.0-flash")

        Returns:
            Response-Text
        """
        if not self.settings.GOOGLE_API_KEY:
            raise ValueError("Google API Key nicht konfiguriert")

        # Gemini SDK ist sync - in executor wrappen
        loop = asyncio.get_event_loop()

        def sync_query():
            gemini_model = genai.GenerativeModel(model)
            full_prompt = f"{self.system_prompt}\n\n{query}"
            response = gemini_model.generate_content(full_prompt)
            return response.text

        response_text = await loop.run_in_executor(None, sync_query)
        return response_text

    async def _query_perplexity(self, query: str, model: str) -> str:
        """
        Query an Perplexity AI.

        Args:
            query: Frage
            model: Model-ID (z.B. "sonar")

        Returns:
            Response-Text
        """
        if not self.perplexity_api_key:
            raise ValueError("Perplexity API Key nicht konfiguriert")

        url = "https://api.perplexity.ai/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.perplexity_api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()

            data = response.json()
            return data["choices"][0]["message"]["content"]
