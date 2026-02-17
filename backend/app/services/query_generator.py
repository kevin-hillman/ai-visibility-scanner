import random
from typing import Any


class QueryGenerator:
    """Generiert branchenspezifische Queries für GEO Intelligence Scans."""

    def __init__(self, industry_config: dict[str, Any]):
        """
        Initialisiert den Query Generator mit Industry Config.

        Args:
            industry_config: Geparste YAML-Config mit queries, services, threats, etc.
        """
        self.config = industry_config
        self.query_config = industry_config.get("queries", {})
        self.categories = self.query_config.get("categories", {})
        self.services = self.query_config.get("services", [])
        self.threats = self.query_config.get("threats", [])
        self.regions = self.query_config.get("regions", [])
        self.competitors = self.query_config.get("competitors", [])
        self.industry_terms = self.query_config.get("industry_terms", [])
        self.target_audiences = self.query_config.get("target_audiences", [])

    def generate_queries(
        self,
        company_name: str,
        company_domain: str,
        company_description: str | None = None,
        company_location: str | None = None
    ) -> list[dict[str, str]]:
        """
        Generiert ~50 Queries für eine Firma basierend auf Industry Config.

        Args:
            company_name: Name der Firma (z.B. "CrowdStrike")
            company_domain: Domain der Firma (z.B. "crowdstrike.com")
            company_description: Optional - Firmenbeschreibung für Kontext
            company_location: Optional - Standort für regionale Queries

        Returns:
            Liste von Query-Dictionaries mit query, category, intent
        """
        all_queries = []

        # Kontext für Platzhalter-Ersetzung vorbereiten
        context = {
            "company_name": company_name,
            "company_domain": company_domain,
            "location": company_location or "DACH",
        }

        # Enforce queries.total budget by scaling category counts deterministically.
        category_target_counts = self._get_category_target_counts()

        # Für jede Kategorie Queries generieren
        for category_name, category_config in self.categories.items():
            target_count = category_target_counts.get(category_name, 0)
            templates = category_config.get("templates", [])

            category_queries = self._generate_category_queries(
                category_name,
                templates,
                target_count,
                context
            )
            all_queries.extend(category_queries)

        # Liste mischen (nicht alle brand-queries hintereinander)
        random.shuffle(all_queries)

        return all_queries

    def _get_category_target_counts(self) -> dict[str, int]:
        """
        Computes per-category query counts. If queries.total is present, scale the
        configured category counts to match the total deterministically.
        """
        raw_counts: dict[str, int] = {}
        for category_name, category_config in self.categories.items():
            try:
                raw = int(category_config.get("count", 10) or 0)
            except (TypeError, ValueError):
                raw = 0
            raw_counts[category_name] = max(0, raw)

        total_budget_raw = self.query_config.get("total", None)
        if total_budget_raw is None:
            return raw_counts

        try:
            total_budget = int(total_budget_raw)
        except (TypeError, ValueError):
            return raw_counts

        if total_budget <= 0:
            return {name: 0 for name in raw_counts}

        total_weight = sum(raw_counts.values())
        if total_weight <= 0:
            return {name: 0 for name in raw_counts}

        # Largest Remainder Method (Hamilton) with deterministic tie-breaking.
        scaled: dict[str, float] = {
            name: (count * total_budget / total_weight)
            for name, count in raw_counts.items()
        }
        base: dict[str, int] = {name: int(value) for name, value in scaled.items()}  # floor

        allocated = sum(base.values())
        remainder = total_budget - allocated
        if remainder <= 0:
            return base

        remainders = sorted(
            ((scaled[name] - base[name], name) for name in base.keys()),
            key=lambda x: (-x[0], x[1])
        )

        for i in range(remainder):
            _, name = remainders[i % len(remainders)]
            base[name] += 1

        return base

    def _generate_category_queries(
        self,
        category: str,
        templates: list[str],
        target_count: int,
        context: dict[str, str]
    ) -> list[dict[str, str]]:
        """
        Generiert Queries für eine spezifische Kategorie.

        Args:
            category: Kategorie-Name (brand, service, problem, comparison, industry)
            templates: Template-Strings mit Platzhaltern
            target_count: Anzahl gewünschter Queries
            context: Basis-Kontext mit company_name, domain, location

        Returns:
            Liste von Query-Dictionaries
        """
        queries = []
        seen_queries = set()

        # Generiere mehr Kombinationen als benötigt, dann sample
        max_attempts = target_count * 3
        attempts = 0

        while len(queries) < target_count and attempts < max_attempts:
            attempts += 1

            # Wähle zufälliges Template
            template = random.choice(templates)

            # Erstelle erweiterten Kontext mit zufälligen Werten
            full_context = self._build_full_context(context, category)

            # Ersetze Platzhalter im Template
            try:
                query_text = template.format(**full_context)
            except KeyError:
                # Falls Platzhalter fehlt, überspringe
                continue

            # Vermeide Duplikate
            if query_text in seen_queries:
                continue

            seen_queries.add(query_text)

            # Bestimme Intent basierend auf Kategorie
            intent = self._determine_intent(category, template)

            queries.append({
                "query": query_text,
                "category": category,
                "intent": intent,
            })

        # Falls nicht genug Queries generiert, fülle mit Variationen
        if len(queries) < target_count:
            queries.extend(
                self._generate_variations(queries, target_count - len(queries))
            )

        return queries[:target_count]

    def _build_full_context(
        self,
        base_context: dict[str, str],
        category: str
    ) -> dict[str, str]:
        """
        Erstellt vollständigen Kontext mit zufälligen Werten für Platzhalter.

        Args:
            base_context: Basis-Kontext mit company_name, domain, location
            category: Kategorie für kontextspezifische Werte

        Returns:
            Vollständiger Kontext-Dict
        """
        context = base_context.copy()

        # Füge zufällige Werte aus Config-Listen hinzu
        if self.services:
            context["service"] = random.choice(self.services)

        if self.threats:
            context["threat"] = random.choice(self.threats)

        if self.regions:
            context["region"] = random.choice(self.regions)

        if self.competitors:
            context["competitor"] = random.choice(self.competitors)

        if self.industry_terms:
            context["industry_term"] = random.choice(self.industry_terms)

        if self.target_audiences:
            context["target_audience"] = random.choice(self.target_audiences)

        # Standardwerte falls Listen leer
        context.setdefault("service", "Cybersecurity")
        context.setdefault("threat", "Ransomware")
        context.setdefault("region", "DACH")
        context.setdefault("competitor", "Competitor")
        context.setdefault("industry_term", "Security")
        context.setdefault("target_audience", "Unternehmen")

        return context

    def _determine_intent(self, category: str, template: str) -> str:
        """
        Bestimmt den Such-Intent basierend auf Kategorie und Template.

        Args:
            category: Kategorie-Name
            template: Template-String

        Returns:
            Intent-Beschreibung
        """
        intent_map = {
            "brand": "Suche nach direkter Markennennung und Reputation",
            "service": "Suche nach Lösungsanbietern für spezifischen Service",
            "problem": "Problemlösungs-orientierte Suche",
            "comparison": "Vergleichs- und Auswahlsuche",
            "industry": "Branchen- und Expertenwissen-Suche",
        }

        return intent_map.get(category, "Allgemeine Informationssuche")

    def _generate_variations(
        self,
        existing_queries: list[dict[str, str]],
        count: int
    ) -> list[dict[str, str]]:
        """
        Generiert Variationen existierender Queries um Target-Count zu erreichen.

        Args:
            existing_queries: Bereits generierte Queries
            count: Anzahl zusätzlich benötigter Queries

        Returns:
            Liste zusätzlicher Query-Variationen
        """
        variations = []
        seen_queries = {q.get("query", "") for q in existing_queries if q.get("query")}
        variation_prefixes = [
            "Welche",
            "Was sind die besten",
            "Empfehlung für",
            "Vergleich von",
            "Wie finde ich",
        ]

        if not existing_queries or count <= 0:
            return variations

        # Generate variations without breaking brand-query invariants (e.g. casing of company name)
        # and avoid duplicates where possible.
        max_attempts = max(10, count * 10)
        attempts = 0

        while len(variations) < count and attempts < max_attempts:
            attempts += 1
            base_query = random.choice(existing_queries)
            prefix = random.choice(variation_prefixes)

            varied_query = f"{prefix} {base_query['query']}"
            if varied_query in seen_queries:
                continue

            seen_queries.add(varied_query)
            variations.append({
                "query": varied_query,
                "category": base_query["category"],
                "intent": base_query["intent"],
            })

        return variations
