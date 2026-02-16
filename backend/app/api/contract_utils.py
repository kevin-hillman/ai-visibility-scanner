from typing import Any


REQUIRED_PLATFORMS: tuple[str, ...] = ("chatgpt", "claude", "gemini", "perplexity")


def normalize_platform_scores(platform_scores: Any) -> dict[str, float]:
    """
    Contract helper: always expose stable platform keys so the frontend does not
    crash on missing keys.
    """
    normalized: dict[str, float] = {}

    if isinstance(platform_scores, dict):
        for key, value in platform_scores.items():
            try:
                normalized[str(key)] = float(value)
            except (TypeError, ValueError):
                # Skip non-numeric values
                continue

    for platform in REQUIRED_PLATFORMS:
        normalized.setdefault(platform, 0.0)

    return normalized


def extract_competitors(analysis: Any) -> list[dict[str, Any]]:
    """
    Contract helper: expose competitors as a flat list derived from
    analysis.top_competitors.
    """
    if not isinstance(analysis, dict):
        return []

    top = analysis.get("top_competitors", [])
    if not isinstance(top, list):
        return []

    competitors: list[dict[str, Any]] = []
    for item in top:
        if not isinstance(item, dict):
            continue
        if "name" not in item or "mentions" not in item:
            continue

        name = str(item.get("name", "")).strip()
        if not name:
            continue

        try:
            mentions = int(item.get("mentions", 0) or 0)
        except (TypeError, ValueError):
            mentions = 0

        competitors.append({"name": name, "mentions": mentions})

    return competitors

