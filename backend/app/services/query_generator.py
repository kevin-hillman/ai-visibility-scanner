from typing import Any


class QueryGenerator:
    """Liest kuratierte Query-Sets aus Industry Config."""

    def __init__(self, industry_config: dict[str, Any]):
        """
        Initialisiert den Query Generator mit Industry Config.

        Args:
            industry_config: Geparste YAML-Config mit queries.generic und queries.brand Listen.
        """
        self.config = industry_config
        self.query_config = industry_config.get("queries", {})

    def generate_queries(
        self,
        company_name: str,
        company_domain: str,
        company_description: str | None = None,
        company_location: str | None = None,
    ) -> list[dict[str, str]]:
        """
        Gibt den kuratierten Query-Satz zurück.

        Generic Queries werden 1:1 übernommen (identisch für alle Firmen).
        Brand Queries ersetzen {company_name} mit dem Firmennamen.

        Args:
            company_name: Name der Firma
            company_domain: Domain der Firma
            company_description: Optional
            company_location: Optional

        Returns:
            Liste von Query-Dictionaries mit query, category, intent
        """
        queries = []

        # Generic Queries — identisch für alle Firmen
        for q in self.query_config.get("generic", []):
            queries.append({
                "query": q["query"],
                "category": q.get("category", "general"),
                "intent": q.get("intent", ""),
            })

        # Brand Queries — Firmenname einsetzen
        for q in self.query_config.get("brand", []):
            queries.append({
                "query": q["query"].format(company_name=company_name),
                "category": q.get("category", "brand"),
                "intent": q.get("intent", ""),
            })

        return queries

    @property
    def query_version(self) -> str:
        """Gibt die Query-Set-Version zurück (z.B. '2026-02-v1')."""
        return self.query_config.get("version", "unknown")
