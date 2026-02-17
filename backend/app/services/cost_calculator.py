"""
Cost Calculator Service.
Maps model names + token counts to USD costs.
"""

# Pricing per 1M tokens (USD)
MODEL_PRICING: dict[str, dict[str, float]] = {
    # OpenAI (current)
    "gpt-5.2": {"input": 1.75, "output": 14.00},
    "gpt-5.2-pro": {"input": 21.00, "output": 168.00},
    # OpenAI (legacy)
    "gpt-4.1": {"input": 2.00, "output": 8.00},
    "gpt-4.1-mini": {"input": 0.40, "output": 1.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    # Anthropic (current)
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00},
    "claude-opus-4-6": {"input": 15.00, "output": 75.00},
    # Anthropic (legacy)
    "claude-sonnet-4-5-20250929": {"input": 3.00, "output": 15.00},
    "claude-haiku-4-5-20251001": {"input": 0.80, "output": 4.00},
    # Google (current)
    "gemini-3-flash-preview": {"input": 0.50, "output": 3.00},
    "gemini-3-pro": {"input": 1.50, "output": 10.00},
    # Google (legacy)
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    # Perplexity
    "sonar": {"input": 1.00, "output": 1.00},
    "sonar-pro": {"input": 3.00, "output": 15.00},
}

FALLBACK_PRICING = {"input": 5.00, "output": 15.00}
CHARS_PER_TOKEN = 4


class CostCalculator:
    """Berechnet API-Kosten basierend auf Token-Verbrauch und Modell-Preislisten."""

    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = MODEL_PRICING.get(model, FALLBACK_PRICING)
        input_cost = input_tokens * pricing["input"] / 1_000_000
        output_cost = output_tokens * pricing["output"] / 1_000_000
        return input_cost + output_cost

    def estimate_tokens(self, text: str) -> int:
        return max(1, len(text) // CHARS_PER_TOKEN)

    def get_pricing(self) -> dict[str, dict[str, float]]:
        return MODEL_PRICING.copy()
