'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { fetchIndustries, Industry } from '@/lib/api';

export default function Header() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isIndustriesOpen, setIsIndustriesOpen] = useState(false);

  useEffect(() => {
    fetchIndustries()
      .then(setIndustries)
      .catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-gray-900 font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-white">GEO</span>
              <span className="text-cyan-400"> Intelligence</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative">
              <button
                onClick={() => setIsIndustriesOpen(!isIndustriesOpen)}
                className="text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
              >
                <span>Branchen</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isIndustriesOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isIndustriesOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                  {industries.map((industry) => (
                    <Link
                      key={industry.id}
                      href={`/ranking/${industry.id}`}
                      onClick={() => setIsIndustriesOpen(false)}
                      className="block px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <div className="font-medium text-white">{industry.display_name}</div>
                      <div className="text-sm text-gray-400 mt-0.5">{industry.description}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link href="/ranking/cybersecurity" className="text-gray-300 hover:text-white transition-colors">
              Rankings
            </Link>
            <Link
              href="#contact"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all"
            >
              Kontakt
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-3">
              <div className="text-gray-400 text-sm font-medium px-2">Branchen</div>
              {industries.map((industry) => (
                <Link
                  key={industry.id}
                  href={`/ranking/${industry.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-2 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors"
                >
                  {industry.display_name}
                </Link>
              ))}
              <Link
                href="/ranking/cybersecurity"
                onClick={() => setIsMenuOpen(false)}
                className="px-2 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded transition-colors"
              >
                Rankings
              </Link>
              <Link
                href="#contact"
                onClick={() => setIsMenuOpen(false)}
                className="px-2 py-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Kontakt
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
