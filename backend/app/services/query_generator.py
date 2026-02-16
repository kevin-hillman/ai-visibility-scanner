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

        # Für jede Kategorie Queries generieren
        for category_name, category_config in self.categories.items():
            target_count = category_config.get("count", 10)
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
        variation_prefixes = [
            "Welche",
            "Was sind die besten",
            "Empfehlung für",
            "Vergleich von",
            "Wie finde ich",
        ]

        for i in range(count):
            if not existing_queries:
                break

            # Wähle zufällige existierende Query
            base_query = random.choice(existing_queries)
            prefix = random.choice(variation_prefixes)

            # Erstelle Variation
            varied_query = f"{prefix} {base_query['query'].lower()}"

            variations.append({
                "query": varied_query,
                "category": base_query["category"],
                "intent": base_query["intent"],
            })

        return variations
