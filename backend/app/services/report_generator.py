from typing import Any
from datetime import datetime


class ReportGenerator:
    """Generiert Handlungsempfehlungen und HTML-Reports für GEO Intelligence Scans."""

    def generate_recommendations(
        self,
        company_name: str,
        analysis: dict[str, Any],
        platform_scores: dict[str, float],
        industry_config: dict[str, Any]
    ) -> list[str]:
        """
        Generiert 5-10 konkrete, actionable Handlungsempfehlungen.

        Args:
            company_name: Name der Firma
            analysis: Aggregierte Analyse von Analyzer
            platform_scores: Score pro Plattform
            industry_config: Industry-Config für Kontext

        Returns:
            Liste von Empfehlungen als Strings
        """
        recommendations = []

        mention_rate = analysis.get("mention_rate", 0)
        avg_position = analysis.get("avg_position")
        sentiment_dist = analysis.get("sentiment_distribution", {})
        worst_categories = analysis.get("worst_categories", [])
        top_competitors = analysis.get("top_competitors", [])

        # 1. Plattform-spezifische Empfehlungen
        for platform, score in platform_scores.items():
            if score < 30:
                recommendations.append(
                    f"🎯 **{platform.upper()}-Optimierung**: Ihre Sichtbarkeit auf {platform} "
                    f"ist mit {score:.1f}/100 Punkten sehr gering. Erstellen Sie hochwertige "
                    f"Inhalte auf autoritativen Quellen, die häufig von {platform} zitiert werden "
                    f"(z.B. Fachpublikationen, Whitepapers, Case Studies)."
                )

        # 2. Markenbekanntheit
        if mention_rate < 30:
            recommendations.append(
                f"🏷️ **Markenpräsenz aufbauen**: Ihr Markenname '{company_name}' wird in nur "
                f"{mention_rate:.1f}% der Fälle von KI-Assistenten erkannt. Fokussieren Sie sich auf:\n"
                f"   • Gastbeiträge in branchenführenden Publikationen\n"
                f"   • Präsenz in Wikipedia und Branchenverzeichnissen\n"
                f"   • Hochwertige Backlinks von autoritativen Domains\n"
                f"   • Strukturierte Daten auf Ihrer Website (Schema.org)"
            )

        # 3. Position-Optimierung
        if avg_position and avg_position > 3:
            recommendations.append(
                f"📊 **Top-3-Platzierung anstreben**: Sie werden durchschnittlich auf Position "
                f"{avg_position:.1f} erwähnt. Um in die Top-3 zu kommen:\n"
                f"   • Veröffentlichen Sie Thought-Leadership-Content\n"
                f"   • Sammeln Sie Kundenbewertungen auf relevanten Plattformen\n"
                f"   • Bauen Sie Autorität durch Zertifizierungen und Awards aus\n"
                f"   • Optimieren Sie Ihre 'About'-Seite mit klaren USPs"
            )
        elif not avg_position and mention_rate > 0:
            recommendations.append(
                f"📈 **Ranking-Position verbessern**: Sie werden erwähnt, aber selten in Listen gerankt. "
                f"Erstellen Sie Vergleichsinhalte und positionieren Sie sich aktiv gegen Wettbewerber."
            )

        # 4. Sentiment-Management
        negative_count = sentiment_dist.get("negative", 0)
        if negative_count > 0:
            recommendations.append(
                f"⚠️ **Negative Erwähnungen adressieren**: Es wurden {negative_count} negative "
                f"Erwähnungen gefunden. Maßnahmen:\n"
                f"   • Analysieren Sie Ihre Online-Bewertungen (G2, Capterra, Trustpilot)\n"
                f"   • Reagieren Sie professionell auf Kritik\n"
                f"   • Veröffentlichen Sie Case Studies zufriedener Kunden\n"
                f"   • Implementieren Sie ein Reputationsmanagement-System"
            )

        # 5. Kategorie-spezifische Empfehlungen
        if worst_categories:
            categories_str = ", ".join(worst_categories[:3])
            recommendations.append(
                f"📝 **Content-Lücken schließen**: Schwache Performance in Kategorien: {categories_str}. "
                f"Erstellen Sie gezielten Content:\n"
                f"   • Blog-Posts zu häufigen Problemen in diesen Bereichen\n"
                f"   • How-to-Guides und Tutorials\n"
                f"   • Video-Content für YouTube und Fachportale\n"
                f"   • Podcast-Auftritte als Experte"
            )

        # 6. Wettbewerber-Analyse
        if top_competitors:
            top_comp = top_competitors[0]
            comp_name = top_comp.get("name", "N/A")
            comp_mentions = top_comp.get("mentions", 0)
            our_mentions = analysis.get("total_mentions", 0)

            if comp_mentions > our_mentions * 2:
                recommendations.append(
                    f"🏆 **Wettbewerber-Differenzierung**: {comp_name} wird {comp_mentions}x erwähnt "
                    f"(vs. Ihre {our_mentions}x). Analysieren Sie deren Content-Strategie:\n"
                    f"   • Welche Themen besetzen sie?\n"
                    f"   • Auf welchen Plattformen sind sie präsent?\n"
                    f"   • Welche Alleinstellungsmerkmale kommunizieren sie?\n"
                    f"   • Differenzieren Sie sich durch Nischen-Expertise"
                )

        # 7. Technische Optimierung
        if mention_rate > 0 and mention_rate < 70:
            recommendations.append(
                f"🔧 **Technische GEO-Optimierung**: Erweitern Sie Ihre Datenquellen-Präsenz:\n"
                f"   • Aktualisieren Sie Ihr LinkedIn-Unternehmensprofil vollständig\n"
                f"   • Pflegen Sie Crunchbase, Bloomberg, Reuters-Einträge\n"
                f"   • Nutzen Sie Google Knowledge Graph\n"
                f"   • Implementieren Sie strukturierte Daten (JSON-LD)\n"
                f"   • Veröffentlichen Sie regelmäßig Pressemitteilungen"
            )

        # 8. Content-Strategie
        if mention_rate < 50:
            recommendations.append(
                f"📚 **Content-Marketing intensivieren**: Ihre GEO-Sichtbarkeit profitiert von:\n"
                f"   • Wöchentlichen Blog-Posts zu Branchenthemen\n"
                f"   • Monatlichen Whitepapers oder Research Reports\n"
                f"   • Quartalsweisen Webinaren mit Aufzeichnung\n"
                f"   • Original-Research und Studien (zitierfähig)\n"
                f"   • Infografiken für Social Sharing"
            )

        # 9. Authority Building
        recommendations.append(
            f"🎓 **Autorität aufbauen**: KI-Modelle bevorzugen autoritäre Quellen:\n"
            f"   • Publizieren Sie in Fachzeitschriften (IEEE, ACM, etc.)\n"
            f"   • Sprechen Sie auf Konferenzen (RSA, Black Hat, etc.)\n"
            f"   • Bieten Sie Expert-Quotes für Journalisten (HARO)\n"
            f"   • Bauen Sie ein Contributor-Profil bei Forbes/TechCrunch auf\n"
            f"   • Werden Sie Mitglied in Branchen-Associations"
        )

        # 10. Monitoring & Iteration
        recommendations.append(
            f"📊 **GEO-Monitoring etablieren**: \n"
            f"   • Führen Sie monatliche GEO-Scans durch\n"
            f"   • Tracken Sie Veränderungen in Platform-Scores\n"
            f"   • A/B-testen Sie Content-Formate\n"
            f"   • Messen Sie ROI Ihrer GEO-Optimierungen\n"
            f"   • Passen Sie Strategie basierend auf Daten an"
        )

        # Limitiere auf 10 Empfehlungen, priorisiere wichtigste
        return recommendations[:10]

    def generate_report_html(
        self,
        company_name: str,
        company_domain: str,
        scan_data: dict[str, Any],
        industry_config: dict[str, Any]
    ) -> str:
        """
        Generiert einen HTML-Report als String.

        Args:
            company_name: Firmenname
            company_domain: Domain
            scan_data: Komplette Scan-Daten (overall_score, platform_scores, analysis, recommendations)
            industry_config: Industry Config für Kontext

        Returns:
            HTML-String
        """
        overall_score = scan_data.get("overall_score", 0)
        platform_scores = scan_data.get("platform_scores", {})
        analysis = scan_data.get("analysis", {})
        recommendations = scan_data.get("recommendations", [])
        query_results = scan_data.get("query_results", [])

        # Score-Color basierend auf Wert
        score_color = self._get_score_color(overall_score)

        # Top Competitors
        top_competitors = analysis.get("top_competitors", [])[:5]

        # Sentiment Distribution
        sentiment_dist = analysis.get("sentiment_distribution", {})

        # Platform Performance
        platform_performance = analysis.get("platform_performance", {})

        # Timestamp
        timestamp = datetime.now().strftime("%d.%m.%Y %H:%M")

        html = f"""
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GEO Intelligence Report - {company_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f7fa;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        .score-section {{
            padding: 40px;
            text-align: center;
            border-bottom: 1px solid #e0e0e0;
        }}
        .overall-score {{
            display: inline-block;
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: {score_color};
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }}
        .overall-score .number {{
            font-size: 4em;
            font-weight: bold;
            line-height: 1;
        }}
        .overall-score .label {{
            font-size: 0.9em;
            opacity: 0.9;
            margin-top: 5px;
        }}
        .content {{
            padding: 40px;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section h2 {{
            font-size: 1.8em;
            margin-bottom: 20px;
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        .platform-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        .platform-card {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }}
        .platform-card h3 {{
            font-size: 1.2em;
            margin-bottom: 10px;
            text-transform: uppercase;
        }}
        .score-bar {{
            width: 100%;
            height: 30px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            margin-top: 10px;
        }}
        .score-bar-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: bold;
            font-size: 0.9em;
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .stat-box {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .stat-box .value {{
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }}
        .stat-box .label {{
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }}
        .list {{
            list-style: none;
            padding: 0;
        }}
        .list li {{
            padding: 12px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .list li:last-child {{
            border-bottom: none;
        }}
        .recommendation {{
            background: #f0f7ff;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin-bottom: 15px;
            border-radius: 4px;
        }}
        .competitor {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f8f9fa;
            margin-bottom: 8px;
            border-radius: 4px;
        }}
        .competitor .name {{
            font-weight: 500;
        }}
        .competitor .count {{
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.9em;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        th, td {{
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }}
        th {{
            background: #f8f9fa;
            font-weight: 600;
            color: #667eea;
        }}
        tr:hover {{
            background: #f8f9fa;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 500;
        }}
        .badge-success {{ background: #d4edda; color: #155724; }}
        .badge-warning {{ background: #fff3cd; color: #856404; }}
        .badge-danger {{ background: #f8d7da; color: #721c24; }}
        .badge-info {{ background: #d1ecf1; color: #0c5460; }}
        .footer {{
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{company_name}</h1>
            <p>GEO Intelligence Report - {company_domain}</p>
            <p style="font-size: 0.9em; opacity: 0.8;">Erstellt am {timestamp}</p>
        </div>

        <!-- Overall Score -->
        <div class="score-section">
            <div class="overall-score" style="display: inline-flex;">
                <div class="number">{overall_score:.1f}</div>
                <div class="label">/ 100</div>
            </div>
            <p style="font-size: 1.2em; color: #666;">Gesamtsichtbarkeit in KI-Assistenten</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Platform Breakdown -->
            <div class="section">
                <h2>📊 Plattform-Performance</h2>
                <div class="platform-grid">
"""

        # Platform Cards
        for platform, score in platform_scores.items():
            perf = platform_performance.get(platform, {})
            mention_rate = perf.get("mention_rate", 0)
            html += f"""
                    <div class="platform-card">
                        <h3>{platform.upper()}</h3>
                        <div style="font-size: 2em; font-weight: bold; color: #667eea;">{score:.1f}</div>
                        <div class="score-bar">
                            <div class="score-bar-fill" style="width: {score}%;">{score:.0f}%</div>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                            Erwähnungsrate: {mention_rate:.1f}%
                        </div>
                    </div>
"""

        html += """
                </div>
            </div>

            <!-- Key Metrics -->
            <div class="section">
                <h2>📈 Wichtige Kennzahlen</h2>
                <div class="stats-grid">
"""

        # Stats
        total_queries = analysis.get("total_queries", 0)
        total_mentions = analysis.get("total_mentions", 0)
        mention_rate = analysis.get("mention_rate", 0)
        avg_position = analysis.get("avg_position")

        html += f"""
                    <div class="stat-box">
                        <div class="value">{total_queries}</div>
                        <div class="label">Gesamt-Queries</div>
                    </div>
                    <div class="stat-box">
                        <div class="value">{total_mentions}</div>
                        <div class="label">Erwähnungen</div>
                    </div>
                    <div class="stat-box">
                        <div class="value">{mention_rate:.1f}%</div>
                        <div class="label">Erwähnungsrate</div>
                    </div>
                    <div class="stat-box">
                        <div class="value">{avg_position if avg_position else 'N/A'}</div>
                        <div class="label">Ø Position</div>
                    </div>
"""

        html += """
                </div>
            </div>

            <!-- SWOT Analysis -->
            <div class="section">
                <h2>💪 Stärken & Schwächen</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <div>
                        <h3 style="color: #28a745; margin-bottom: 15px;">✓ Stärken</h3>
                        <ul class="list">
"""

        strengths = analysis.get("strengths", [])
        if strengths:
            for strength in strengths:
                html += f"                            <li>{strength}</li>\n"
        else:
            html += "                            <li>Noch keine signifikanten Stärken identifiziert</li>\n"

        html += """
                        </ul>
                    </div>
                    <div>
                        <h3 style="color: #dc3545; margin-bottom: 15px;">⚠ Schwächen</h3>
                        <ul class="list">
"""

        weaknesses = analysis.get("weaknesses", [])
        if weaknesses:
            for weakness in weaknesses:
                html += f"                            <li>{weakness}</li>\n"
        else:
            html += "                            <li>Keine kritischen Schwächen gefunden</li>\n"

        html += """
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Competitors -->
            <div class="section">
                <h2>🏆 Top Wettbewerber</h2>
"""

        if top_competitors:
            for comp in top_competitors:
                comp_name = comp.get("name", "N/A")
                comp_mentions = comp.get("mentions", 0)
                html += f"""
                <div class="competitor">
                    <span class="name">{comp_name}</span>
                    <span class="count">{comp_mentions} Erwähnungen</span>
                </div>
"""
        else:
            html += "                <p>Keine Wettbewerber in den Ergebnissen erwähnt.</p>\n"

        html += """
            </div>

            <!-- Recommendations -->
            <div class="section">
                <h2>💡 Handlungsempfehlungen</h2>
"""

        for i, rec in enumerate(recommendations, 1):
            # Konvertiere Markdown-Bold zu HTML
            rec_html = rec.replace("**", "<strong>").replace("**", "</strong>")
            # Konvertiere Newlines zu <br>
            rec_html = rec_html.replace("\n", "<br>")

            html += f"""
                <div class="recommendation">
                    <div style="font-weight: 600; margin-bottom: 8px;">Empfehlung {i}</div>
                    <div>{rec_html}</div>
                </div>
"""

        html += """
            </div>

            <!-- Query Results Detail -->
            <div class="section">
                <h2>🔍 Detaillierte Query-Ergebnisse</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Query</th>
                            <th>Plattform</th>
                            <th>Kategorie</th>
                            <th>Erwähnt</th>
                            <th>Type</th>
                            <th>Position</th>
                            <th>Sentiment</th>
                        </tr>
                    </thead>
                    <tbody>
"""

        # Zeige nur erste 50 Results (zu viele würden Report zu groß machen)
        for result in query_results[:50]:
            query_text = result.get("query", "N/A")[:60]  # Kürze lange Queries
            platform = result.get("platform", "N/A").upper()
            category = result.get("category", "N/A")
            mentioned = result.get("mentioned", False)
            mention_type = result.get("mention_type", "not_mentioned")
            position = result.get("position") or "-"
            sentiment = result.get("sentiment", "neutral")

            # Badges
            mentioned_badge = '<span class="badge badge-success">Ja</span>' if mentioned else '<span class="badge badge-danger">Nein</span>'

            sentiment_badge_class = {
                "positive": "badge-success",
                "neutral": "badge-info",
                "negative": "badge-danger",
            }.get(sentiment, "badge-info")
            sentiment_badge = f'<span class="badge {sentiment_badge_class}">{sentiment}</span>'

            html += f"""
                        <tr>
                            <td>{query_text}...</td>
                            <td>{platform}</td>
                            <td>{category}</td>
                            <td>{mentioned_badge}</td>
                            <td>{mention_type.replace('_', ' ').title()}</td>
                            <td>{position}</td>
                            <td>{sentiment_badge}</td>
                        </tr>
"""

        html += """
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Generiert von GEO Intelligence Engine</p>
            <p>© 2026 - Powered by Multi-LLM Analysis</p>
        </div>
    </div>
</body>
</html>
"""

        return html

    def _get_score_color(self, score: float) -> str:
        """
        Gibt Farbe basierend auf Score zurück.

        Args:
            score: Score 0-100

        Returns:
            CSS-Farbe (Hex oder Gradient)
        """
        if score >= 80:
            return "#28a745"  # Grün
        elif score >= 60:
            return "#ffc107"  # Gelb
        elif score >= 40:
            return "#fd7e14"  # Orange
        else:
            return "#dc3545"  # Rot
