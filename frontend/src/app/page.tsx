import Link from 'next/link';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative">
          <div className="max-w-4xl">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">KI-Sichtbarkeit messen.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-transparent bg-clip-text">
                Wettbewerber überholen.
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              Wie sichtbar ist Ihr Unternehmen in ChatGPT, Claude, Gemini und Perplexity?
              Messen Sie Ihre GEO-Performance und entdecken Sie ungenutztes Potenzial.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/ranking/cybersecurity"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all text-center"
              >
                Rankings ansehen
              </Link>
              <a
                href="#contact"
                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all text-center"
              >
                Kostenlose Analyse
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What is GEO Section */}
      <section className="py-20 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Was ist <span className="text-cyan-400">GEO</span>?
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              Generative Engine Optimization ist die neue Dimension der Online-Sichtbarkeit.
              Während SEO für Google optimiert, fokussiert sich GEO auf KI-gestützte Antwortmaschinen
              wie ChatGPT, Claude, Gemini und Perplexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Messbare Ergebnisse</h3>
              <p className="text-gray-400">
                Objektive Scores über 4 führende KI-Plattformen. Vergleichen Sie sich mit Wettbewerbern.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Konkrete Handlungsempfehlungen</h3>
              <p className="text-gray-400">
                Keine vagen Tipps. Wir zeigen Ihnen exakt, wo Sie ansetzen müssen.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Zukunftssicher</h3>
              <p className="text-gray-400">
                40% aller Suchanfragen werden bereits über KI-Chatbots gestellt. Trend steigend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-cyan-400 mb-2">500+</div>
              <div className="text-gray-400">Unternehmen analysiert</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-cyan-400 mb-2">4</div>
              <div className="text-gray-400">KI-Plattformen</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-cyan-400 mb-2">50+</div>
              <div className="text-gray-400">Queries pro Analyse</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-cyan-900/20 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Bereit für mehr Sichtbarkeit?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Lassen Sie uns Ihre KI-Präsenz analysieren und maßgeschneiderte Strategien entwickeln.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ranking/cybersecurity"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all"
            >
              Ranking ansehen
            </Link>
            <a
              href="mailto:info@geo-intelligence.de"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
