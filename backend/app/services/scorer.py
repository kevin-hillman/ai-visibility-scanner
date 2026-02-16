from typing import Any


class Scorer:
    """Berechnet Scores für GEO Intelligence basierend auf Erwähnungen und Kontext."""

    def __init__(self, industry_config: dict[str, Any]):
        """
        Initialisiert Scorer mit Industry Config.

        Args:
            industry_config: Geparste YAML-Config mit Scoring-Weights
        """
        self.config = industry_config
        self.scoring_config = industry_config.get("scoring", {})
        self.mention_type_weights = self.scoring_config.get("mention_types", {
            "direct_recommendation": 1.0,
            "listed_among_top": 0.8,
            "mentioned_positively": 0.6,
            "mentioned_neutrally": 0.3,
            "not_mentioned": 0.0,
        })
        self.platform_weights = {
            platform: config.get("weight", 0.25)
            for platform, config in industry_config.get("platforms", {}).items()
        }

    def score_single_result(self, analysis_result: dict[str, Any]) -> float:
        """
        Bewertet ein einzelnes Query-Ergebnis (0-100).

        Args:
            analysis_result: Ergebnis von Analyzer.analyze_response()

        Returns:
            Score zwischen 0 und 100
        """
        # Basis-Score aus Mention-Type
        mention_type = analysis_result.get("mention_type", "not_mentioned")
        base_score = self.mention_type_weights.get(mention_type, 0.0)

        # Position Bonus (nur wenn erwähnt)
        position_bonus = 0.0
        if analysis_result.get("mentioned", False):
            position = analysis_result.get("position")
            if position:
                if position == 1:
                    position_bonus = 0.20  # +20% für Platz 1
                elif position == 2:
                    position_bonus = 0.10  # +10% für Platz 2
                elif position == 3:
                    position_bonus = 0.05  # +5% für Platz 3

        # Sentiment Modifier
        sentiment = analysis_result.get("sentiment", "neutral")
        sentiment_modifier = {
            "positive": 1.0,
            "neutral": 0.8,
            "negative": 0.5,
        }.get(sentiment, 0.8)

        # Finaler Score: (base_score + position_bonus) * sentiment_modifier * 100
        score = (base_score + position_bonus) * sentiment_modifier * 100

        # Clamp auf 0-100
        return max(0.0, min(100.0, score))

    def calculate_platform_scores(
        self,
        results: list[dict[str, Any]]
    ) -> dict[str, float]:
        """
        Berechnet Score pro Plattform (0-100).

        Args:
            results: Liste aller Analyse-Ergebnisse mit 'platform' und Score-Daten

        Returns:
            Dictionary: platform -> score
        """
        platform_results = {}

        # Gruppiere Results nach Plattform
        for result in results:
            platform = result.get("platform", "unknown")

            if platform not in platform_results:
                platform_results[platform] = []

            platform_results[platform].append(result)

        # Berechne Durchschnitt pro Plattform
        platform_scores = {}

        for platform, platform_res in platform_results.items():
            # Support both flat and nested analysis structure
            scores = [
                self.score_single_result(r.get("analysis", r))
                for r in platform_res
            ]

            if scores:
                avg_score = sum(scores) / len(scores)
                platform_scores[platform] = round(avg_score, 2)
            else:
                platform_scores[platform] = 0.0

        return platform_scores

    def calculate_overall_score(
        self,
        platform_scores: dict[str, float]
    ) -> float:
        """
        Berechnet gewichteten Gesamt-Score über alle Plattformen.

        Args:
            platform_scores: Dictionary mit platform -> score

        Returns:
            Gewichteter Gesamt-Score (0-100)
        """
        if not platform_scores:
            return 0.0

        weighted_sum = 0.0
        total_weight = 0.0

        for platform, score in platform_scores.items():
            # Ignore unknown platforms rather than applying a default weight.
            # This keeps overall_score stable even if contract normalization adds
            # platforms that are not configured for the given industry.
            weight = self.platform_weights.get(platform, 0.0)
            weighted_sum += score * weight
            total_weight += weight

        if total_weight == 0:
            return 0.0

        overall_score = weighted_sum / total_weight

        return round(overall_score, 2)

    def calculate_category_scores(
        self,
        results: list[dict[str, Any]]
    ) -> dict[str, float]:
        """
        Berechnet Score pro Query-Kategorie (brand, service, problem, etc.).

        Args:
            results: Liste aller Analyse-Ergebnisse mit 'category'

        Returns:
            Dictionary: category -> score
        """
        category_results = {}

        # Gruppiere Results nach Kategorie
        for result in results:
            category = result.get("category", "unknown")

            if category not in category_results:
                category_results[category] = []

            category_results[category].append(result)

        # Berechne Durchschnitt pro Kategorie
        category_scores = {}

        for category, cat_res in category_results.items():
            scores = [self.score_single_result(r) for r in cat_res]

            if scores:
                avg_score = sum(scores) / len(scores)
                category_scores[category] = round(avg_score, 2)
            else:
                category_scores[category] = 0.0

        return category_scores

    def get_score_breakdown(
        self,
        analysis_result: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Liefert detaillierte Score-Aufschlüsselung für ein Ergebnis.

        Args:
            analysis_result: Einzelnes Analyse-Ergebnis

        Returns:
            Dictionary mit Score-Komponenten
        """
        mention_type = analysis_result.get("mention_type", "not_mentioned")
        base_score = self.mention_type_weights.get(mention_type, 0.0)

        position = analysis_result.get("position")
        position_bonus = 0.0
        if position:
            if position == 1:
                position_bonus = 0.20
            elif position == 2:
                position_bonus = 0.10
            elif position == 3:
                position_bonus = 0.05

        sentiment = analysis_result.get("sentiment", "neutral")
        sentiment_modifier = {
            "positive": 1.0,
            "neutral": 0.8,
            "negative": 0.5,
        }.get(sentiment, 0.8)

        final_score = (base_score + position_bonus) * sentiment_modifier * 100

        return {
            "base_score": round(base_score * 100, 2),
            "position_bonus": round(position_bonus * 100, 2),
            "sentiment_modifier": sentiment_modifier,
            "final_score": round(final_score, 2),
            "components": {
                "mention_type": mention_type,
                "position": position,
                "sentiment": sentiment,
            }
        }

    def compare_to_competitors(
        self,
        our_score: float,
        competitor_scores: dict[str, float]
    ) -> dict[str, Any]:
        """
        Vergleicht unseren Score mit Wettbewerbern.

        Args:
            our_score: Unser Gesamt-Score
            competitor_scores: Dictionary competitor_name -> score

        Returns:
            Vergleichs-Analyse
        """
        if not competitor_scores:
            return {
                "rank": 1,
                "percentile": 100.0,
                "better_than": [],
                "worse_than": [],
            }

        # Alle Scores für Ranking
        all_scores = list(competitor_scores.values()) + [our_score]
        all_scores_sorted = sorted(all_scores, reverse=True)

        # Unser Rank
        our_rank = all_scores_sorted.index(our_score) + 1

        # Percentile
        percentile = ((len(all_scores) - our_rank) / len(all_scores)) * 100

        # Besser/schlechter als
        better_than = [
            name for name, score in competitor_scores.items()
            if score < our_score
        ]
        worse_than = [
            name for name, score in competitor_scores.items()
            if score > our_score
        ]

        return {
            "rank": our_rank,
            "total_competitors": len(competitor_scores),
            "percentile": round(percentile, 2),
            "better_than": better_than,
            "worse_than": worse_than,
            "score_gap_to_leader": round(max(all_scores) - our_score, 2) if worse_than else 0.0,
        }
