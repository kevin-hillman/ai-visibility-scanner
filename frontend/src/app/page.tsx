import Link from 'next/link';

function HeroRankingPreview() {
  const mockEntries = [
    { rank: 1, name: 'CrowdStrike', score: 87.2 },
    { rank: 2, name: 'Palo Alto Networks', score: 81.5 },
    { rank: 3, name: 'Fortinet', score: 74.3 },
    { rank: 4, name: 'SentinelOne', score: 68.1 },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-4 bg-teal-400/20 dark:bg-teal-400/10 rounded-3xl blur-3xl" />
      <div className="relative bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-2xl shadow-xl rotate-1 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">Cybersecurity Ranking</div>
          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2.5 py-1">Live</div>
        </div>
        <div className="space-y-3">
          {mockEntries.map((entry) => {
            const barColor = entry.score >= 70 ? 'bg-emerald-500' : 'bg-yellow-500';
            const textColor = entry.score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400';
            return (
              <div key={entry.rank} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                  {entry.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.name}</div>
                  <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${entry.score}%` }} />
                  </div>
                </div>
                <div className={`text-sm font-semibold tabular-nums ${textColor}`}>{entry.score}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span>ChatGPT</span><span>Claude</span><span>Gemini</span><span>Perplexity</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden dot-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-4">KI-Sichtbarkeit messen</div>
              <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 dark:text-white leading-tight mb-6">
                Wie sichtbar ist Ihr Unternehmen in KI-Chatbots?
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
                Messen Sie Ihre GEO-Performance in ChatGPT, Claude, Gemini und Perplexity. Entdecken Sie ungenutztes Potenzial und ueberholen Sie Ihre Wettbewerber.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/ranking/cybersecurity" className="px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all text-center">
                  Rankings ansehen
                </Link>
                <a href="#contact" className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center flex items-center justify-center gap-2">
                  Kostenlose Analyse
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </a>
              </div>
              <p className="mt-6 text-sm text-gray-400">500+ Unternehmen analysiert</p>
            </div>
            <div className="hidden lg:block"><HeroRankingPreview /></div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide uppercase mb-3">Warum GEO?</div>
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-6">Was ist Generative Engine Optimization?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              Waehrend SEO fuer Google optimiert, fokussiert sich GEO auf KI-gestuetzte Antwortmaschinen wie ChatGPT, Claude, Gemini und Perplexity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, title: 'Messbare Ergebnisse', desc: 'Objektive Scores ueber 4 fuehrende KI-Plattformen. Vergleichen Sie sich mit Wettbewerbern.' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: 'Konkrete Empfehlungen', desc: 'Keine vagen Tipps. Wir zeigen Ihnen exakt, wo Sie ansetzen muessen.' },
              { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: 'Zukunftssicher', desc: '40% aller Suchanfragen werden bereits ueber KI-Chatbots gestellt. Trend steigend.' },
            ].map((f) => (
              <div key={f.title} className="bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-[#1a1d27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[{ value: '500+', label: 'Unternehmen analysiert' }, { value: '4', label: 'KI-Plattformen' }, { value: '50+', label: 'Queries pro Analyse' }].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-semibold text-teal-600 dark:text-teal-400 mb-2">{stat.value}</div>
                <div className="text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 border-t border-gray-200 dark:border-[#2e3039]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 dark:text-white mb-6">Bereit fuer mehr Sichtbarkeit?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Lassen Sie uns Ihre KI-Praesenz analysieren und massgeschneiderte Strategien entwickeln.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/ranking/cybersecurity" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">Ranking ansehen</Link>
            <a href="mailto:info@geo-intelligence.de" className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Kontakt aufnehmen</a>
          </div>
        </div>
      </section>
    </div>
  );
}
