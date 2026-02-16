import re
from typing import Any
from collections import defaultdict


class Analyzer:
    """Analysiert LLM-Antworten auf Firmen-Erwähnungen und Kontext."""

    def analyze_response(
        self,
        company_name: str,
        company_domain: str,
        query: str,
        platform: str,
        response_text: str
    ) -> dict[str, Any]:
        """
        Analysiert eine einzelne LLM-Antwort auf Erwähnung der Firma.

        Args:
            company_name: Name der Firma (z.B. "CrowdStrike")
            company_domain: Domain der Firma (z.B. "crowdstrike.com")
            query: Die gestellte Query
            platform: Plattform-Name (chatgpt, claude, gemini, perplexity)
            response_text: Die LLM-Antwort

        Returns:
            Dictionary mit Analyse-Ergebnissen
        """
        # Bereinige Domain (ohne www./https://)
        clean_domain = company_domain.replace("www.", "").replace("https://", "").replace("http://", "")

        # Suche nach Erwähnungen
        mentions = self._find_mentions(company_name, clean_domain, response_text)

        if not mentions:
            return {
                "mentioned": False,
                "mention_type": "not_mentioned",
                "mention_count": 0,
                "position": None,
                "context": "",
                "sentiment": "neutral",
                "competitors_mentioned": [],
            }

        # Analysiere erste/beste Erwähnung
        best_mention = mentions[0]

        mention_type = self._determine_mention_type(best_mention["context"], response_text)
        position = self._extract_position(best_mention["context"], response_text)
        sentiment = self._analyze_sentiment(best_mention["context"])
        competitors = self._extract_competitors(response_text, company_name)

        return {
            "mentioned": True,
            "mention_type": mention_type,
            "mention_count": len(mentions),
            "position": position,
            "context": best_mention["context"][:400],  # Limit context length
            "sentiment": sentiment,
            "competitors_mentioned": competitors,
        }

    def _find_mentions(
        self,
        company_name: str,
        clean_domain: str,
        response_text: str
    ) -> list[dict[str, Any]]:
        """
        Findet alle Erwähnungen der Firma im Text.

        Args:
            company_name: Firmenname
            clean_domain: Bereinigte Domain
            response_text: Zu durchsuchender Text

        Returns:
            Liste von Mention-Dictionaries mit position und context
        """
        mentions = []

        # Suche nach Firmenname (case-insensitive)
        name_pattern = re.compile(re.escape(company_name), re.IGNORECASE)
        for match in name_pattern.finditer(response_text):
            start = match.start()
            context = self._extract_context(response_text, start)
            mentions.append({
                "position": start,
                "type": "name",
                "context": context
            })

        # Suche nach Domain
        domain_pattern = re.compile(re.escape(clean_domain), re.IGNORECASE)
        for match in domain_pattern.finditer(response_text):
            start = match.start()
            context = self._extract_context(response_text, start)
            mentions.append({
                "position": start,
                "type": "domain",
                "context": context
            })

        # Suche nach Varianten (z.B. "Crowd Strike" für "CrowdStrike")
        name_variants = self._generate_name_variants(company_name)
        for variant in name_variants:
            variant_pattern = re.compile(re.escape(variant), re.IGNORECASE)
            for match in variant_pattern.finditer(response_text):
                start = match.start()
                context = self._extract_context(response_text, start)
                mentions.append({
                    "position": start,
                    "type": "variant",
                    "context": context
                })

        # Sortiere nach Position, entferne Duplikate (gleiche Position)
        seen_positions = set()
        unique_mentions = []
        for mention in sorted(mentions, key=lambda x: x["position"]):
            if mention["position"] not in seen_positions:
                unique_mentions.append(mention)
                seen_positions.add(mention["position"])

        return unique_mentions

    def _extract_context(self, text: str, position: int, window: int = 200) -> str:
        """
        Extrahiert Kontext um eine Erwähnung (±window Zeichen).

        Args:
            text: Gesamter Text
            position: Position der Erwähnung
            window: Anzahl Zeichen vor/nach Erwähnung

        Returns:
            Kontext-String
        """
        start = max(0, position - window)
        end = min(len(text), position + window)

        context = text[start:end]

        # Füge Ellipsen hinzu wenn gekürzt
        if start > 0:
            context = "..." + context
        if end < len(text):
            context = context + "..."

        return context.strip()

    def _generate_name_variants(self, company_name: str) -> list[str]:
        """
        Generiert Varianten des Firmennamens.

        Args:
            company_name: Ursprünglicher Firmenname

        Returns:
            Liste von Namens-Varianten
        """
        variants = []

        # CamelCase -> Space-separated (z.B. "CrowdStrike" -> "Crowd Strike")
        spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', company_name)
        if spaced != company_name:
            variants.append(spaced)

        # Mit/ohne Bindestriche
        if "-" in company_name:
            variants.append(company_name.replace("-", " "))
        elif " " in company_name:
            variants.append(company_name.replace(" ", "-"))

        return variants

    def _determine_mention_type(self, context: str, full_text: str) -> str:
        """
        Bestimmt den Typ der Erwähnung basierend auf Kontext.

        Args:
            context: Lokaler Kontext um die Erwähnung
            full_text: Gesamter Response-Text

        Returns:
            Mention-Type (direct_recommendation, listed_among_top, mentioned_positively, mentioned_neutrally)
        """
        context_lower = context.lower()

        # Direct recommendation keywords
        recommendation_keywords = [
            "empfehle", "empfehlenswert", "empfohlen", "führend", "top", "beste",
            "hervorragend", "ausgezeichnet", "ideal", "perfekt", "sollten sie",
            "rate ich", "beste wahl", "first choice", "recommend", "leading"
        ]

        if any(keyword in context_lower for keyword in recommendation_keywords):
            return "direct_recommendation"

        # Check if in numbered/bulleted list
        list_patterns = [
            r'\d+\.\s',  # 1. 2. 3.
            r'[•\-\*]\s',  # • - *
            r'\n\s*\d+\)',  # 1) 2) 3)
        ]

        for pattern in list_patterns:
            if re.search(pattern, context):
                # Prüfe ob in Top-3
                position = self._extract_position(context, full_text)
                if position and position <= 3:
                    return "listed_among_top"

        # Positive keywords
        positive_keywords = [
            "gut", "sehr gut", "stark", "solide", "zuverlässig", "bewährt",
            "erfolgreich", "innovativ", "leistungsstark", "effektiv",
            "good", "great", "strong", "reliable", "effective"
        ]

        if any(keyword in context_lower for keyword in positive_keywords):
            return "mentioned_positively"

        return "mentioned_neutrally"

    def _extract_position(self, context: str, full_text: str) -> int | None:
        """
        Extrahiert Position in Liste (falls vorhanden).

        Args:
            context: Lokaler Kontext
            full_text: Gesamter Text

        Returns:
            Position (1-basiert) oder None
        """
        # Suche nach Listennummer im Kontext
        patterns = [
            r'(\d+)\.\s',  # 1. 2. 3.
            r'\n\s*(\d+)\)',  # 1) 2) 3)
        ]

        for pattern in patterns:
            match = re.search(pattern, context)
            if match:
                try:
                    return int(match.group(1))
                except (ValueError, IndexError):
                    pass

        # Suche nach "Platz X" oder "Rang X"
        rank_match = re.search(r'(?:platz|rang|position)\s+(\d+)', context.lower())
        if rank_match:
            try:
                return int(rank_match.group(1))
            except ValueError:
                pass

        return None

    def _analyze_sentiment(self, context: str) -> str:
        """
        Analysiert Sentiment der Erwähnung.

        Args:
            context: Kontext-String

        Returns:
            Sentiment: positive, neutral, negative
        """
        context_lower = context.lower()

        # Negative keywords
        negative_keywords = [
            "schlecht", "schwach", "mangelhaft", "unzureichend", "problematisch",
            "kritisch", "negativ", "nachteil", "nicht empfehlenswert",
            "bad", "poor", "weak", "problematic", "issues", "problems"
        ]

        if any(keyword in context_lower for keyword in negative_keywords):
            return "negative"

        # Positive keywords
        positive_keywords = [
            "empfehle", "gut", "sehr gut", "beste", "führend", "hervorragend",
            "ausgezeichnet", "stark", "innovativ", "zuverlässig", "erfolgreich",
            "recommend", "great", "excellent", "best", "leading", "strong"
        ]

        if any(keyword in context_lower for keyword in positive_keywords):
            return "positive"

        return "neutral"

    def _extract_competitors(self, response_text: str, company_name: str) -> list[str]:
        """
        Extrahiert erwähnte Wettbewerber aus der Antwort.

        Args:
            response_text: Gesamter Response-Text
            company_name: Eigener Firmenname (wird ausgeschlossen)

        Returns:
            Liste erkannter Wettbewerber-Namen
        """
        # Bekannte Cybersecurity-Unternehmen (sollte aus Industry Config kommen)
        # Hier Fallback-Liste
        known_competitors = [
            "CrowdStrike", "Palo Alto Networks", "Fortinet", "Check Point",
            "Cisco", "SentinelOne", "Trend Micro", "Sophos", "McAfee",
            "Symantec", "FireEye", "Proofpoint", "Zscaler", "Okta",
            "Tenable", "Rapid7", "Qualys", "Carbon Black", "Cylance"
        ]

        mentioned = []

        for competitor in known_competitors:
            if competitor.lower() == company_name.lower():
                continue

            # Case-insensitive Suche
            if re.search(re.escape(competitor), response_text, re.IGNORECASE):
                mentioned.append(competitor)

        return mentioned

    def aggregate_analysis(
        self,
        company_name: str,
        all_results: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """
        Aggregiert alle Query-Ergebnisse zu einer Gesamtanalyse.

        Args:
            company_name: Firmenname
            all_results: Liste aller analyze_response() Ergebnisse

        Returns:
            Aggregierte Analyse mit KPIs und Insights
        """
        total_queries = len(all_results)
        total_mentions = sum(1 for r in all_results if r.get("mentioned", False))

        # Mention Rate
        mention_rate = (total_mentions / total_queries * 100) if total_queries > 0 else 0.0

        # Durchschnittliche Position (nur für Mentions mit Position)
        positions = [r.get("position") for r in all_results if r.get("position")]
        avg_position = sum(positions) / len(positions) if positions else None

        # Sentiment Distribution
        sentiment_counts = defaultdict(int)
        for result in all_results:
            if result.get("mentioned"):
                sentiment = result.get("sentiment", "neutral")
                sentiment_counts[sentiment] += 1

        # Competitor-Analyse
        competitor_counts = defaultdict(int)
        for result in all_results:
            for competitor in result.get("competitors_mentioned", []):
                competitor_counts[competitor] += 1

        top_competitors = sorted(
            [{"name": name, "mentions": count} for name, count in competitor_counts.items()],
            key=lambda x: x["mentions"],
            reverse=True
        )[:10]

        # Kategorie-Performance
        category_performance = self._analyze_category_performance(all_results)

        # Plattform-Performance
        platform_performance = self._analyze_platform_performance(all_results)

        # SWOT-Analyse
        strengths, weaknesses, opportunities = self._generate_swot(
            mention_rate, avg_position, sentiment_counts, category_performance
        )

        return {
            "total_queries": total_queries,
            "total_mentions": total_mentions,
            "mention_rate": round(mention_rate, 2),
            "avg_position": round(avg_position, 2) if avg_position else None,
            "sentiment_distribution": dict(sentiment_counts),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "top_competitors": top_competitors,
            "best_categories": category_performance["best"],
            "worst_categories": category_performance["worst"],
            "platform_performance": platform_performance,
        }

    def _analyze_category_performance(
        self,
        all_results: list[dict[str, Any]]
    ) -> dict[str, list[str]]:
        """Analysiert Performance nach Query-Kategorien."""
        category_mentions = defaultdict(lambda: {"total": 0, "mentioned": 0})

        for result in all_results:
            category = result.get("category", "unknown")
            category_mentions[category]["total"] += 1
            if result.get("mentioned"):
                category_mentions[category]["mentioned"] += 1

        # Berechne Mention-Rate pro Kategorie
        category_rates = {}
        for category, counts in category_mentions.items():
            rate = (counts["mentioned"] / counts["total"] * 100) if counts["total"] > 0 else 0
            category_rates[category] = rate

        # Sortiere
        sorted_categories = sorted(category_rates.items(), key=lambda x: x[1], reverse=True)

        return {
            "best": [cat for cat, _ in sorted_categories[:3]],
            "worst": [cat for cat, _ in sorted_categories[-3:]],
        }

    def _analyze_platform_performance(
        self,
        all_results: list[dict[str, Any]]
    ) -> dict[str, dict[str, float]]:
        """Analysiert Performance nach Plattform."""
        platform_stats = defaultdict(lambda: {"total": 0, "mentioned": 0})

        for result in all_results:
            platform = result.get("platform", "unknown")
            platform_stats[platform]["total"] += 1
            if result.get("mentioned"):
                platform_stats[platform]["mentioned"] += 1

        # Berechne Rates
        performance = {}
        for platform, stats in platform_stats.items():
            rate = (stats["mentioned"] / stats["total"] * 100) if stats["total"] > 0 else 0
            performance[platform] = {
                "mention_rate": round(rate, 2),
                "total_queries": stats["total"],
                "total_mentions": stats["mentioned"],
            }

        return performance

    def _generate_swot(
        self,
        mention_rate: float,
        avg_position: float | None,
        sentiment_counts: dict[str, int],
        category_performance: dict[str, list[str]]
    ) -> tuple[list[str], list[str], list[str]]:
        """Generiert SWOT-Analyse."""
        strengths = []
        weaknesses = []
        opportunities = []

        # Strengths
        if mention_rate > 50:
            strengths.append("Hohe Sichtbarkeit in KI-Assistenten")
        if avg_position and avg_position <= 2:
            strengths.append("Regelmäßige Top-3-Platzierung")
        if sentiment_counts.get("positive", 0) > sentiment_counts.get("negative", 0):
            strengths.append("Überwiegend positive Erwähnungen")

        # Weaknesses
        if mention_rate < 30:
            weaknesses.append("Geringe Sichtbarkeit in KI-Assistenten")
        if avg_position and avg_position > 5:
            weaknesses.append("Selten in Top-Empfehlungen")
        if sentiment_counts.get("negative", 0) > 0:
            weaknesses.append("Negative Erwähnungen vorhanden")

        # Opportunities
        if category_performance["worst"]:
            opportunities.append(f"Verbesserungspotenzial in Kategorien: {', '.join(category_performance['worst'])}")
        if mention_rate < 70:
            opportunities.append("Ausbau der Content-Präsenz auf autoritativen Quellen")

        return strengths, weaknesses, opportunities
