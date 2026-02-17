import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-[#1a1d27] border-t border-gray-200 dark:border-[#2e3039] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">GEO Intelligence</span>
            <span className="text-sm text-gray-400">—</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">KI-Sichtbarkeit messen</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/datenschutz" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Datenschutz</Link>
            <Link href="/impressum" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Impressum</Link>
            <Link href="/agb" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">AGB</Link>
            <a href="mailto:info@geo-intelligence.de" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Kontakt</a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2e3039] text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} GEO Intelligence Engine. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
