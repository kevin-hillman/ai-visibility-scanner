'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchIndustries, Industry } from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';

export default function Header() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchIndustries()
      .then(setIndustries)
      .catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-sm border-b border-gray-200 dark:border-[#2e3039]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              GEO Intelligence
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <div className="relative">
              <button
                onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>Branchen</span>
                <svg className={`w-4 h-4 transition-transform ${isIndustriesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isIndustriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-[#2e3039] rounded-xl shadow-lg overflow-hidden">
                  {industries.map((industry) => (
                    <Link
                      key={industry.id}
                      href={`/ranking/${industry.id}`}
                      onClick={() => setIsIndustriesOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-[#2e3039] last:border-b-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{industry.display_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{industry.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/ranking/cybersecurity" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Rankings
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <Link href="/admin/costs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              Admin
            </Link>

            <Link href="#contact" className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors">
              Kontakt
            </Link>
          </div>

          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Theme umschalten"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-[#2e3039]">
            <div className="flex flex-col space-y-1">
              <div className="text-gray-400 text-sm font-medium px-2 py-2 uppercase tracking-wide">Branchen</div>
              {industries.map((industry) => (
                <Link key={industry.id} href={`/ranking/${industry.id}`} onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {industry.display_name}
                </Link>
              ))}
              <Link href="/ranking/cybersecurity" onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                Rankings
              </Link>
              <Link href="/admin/costs" onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                Admin
              </Link>
              <Link href="#contact" onClick={() => setIsMenuOpen(false)}
                className="px-3 py-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
                Kontakt
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
