import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold">
                <span className="text-white">GEO</span>
                <span className="text-cyan-400"> Intelligence</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Die führende Plattform zur Messung und Optimierung Ihrer KI-Sichtbarkeit.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Rechtliches</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/datenschutz" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                Datenschutz
              </Link>
              <Link href="/impressum" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                Impressum
              </Link>
              <Link href="/agb" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors">
                AGB
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontakt</h3>
            <div className="text-gray-400 text-sm space-y-2">
              <p>Haben Sie Fragen?</p>
              <a href="mailto:info@geo-intelligence.de" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                info@geo-intelligence.de
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} GEO Intelligence Engine. Alle Rechte vorbehalten.</p>
          <p className="mt-2 text-xs text-gray-500">
            Powered by Advanced AI Analytics • Messungen basieren auf OpenAI ChatGPT, Anthropic Claude, Google Gemini & Perplexity AI
          </p>
        </div>
      </div>
    </footer>
  );
}
