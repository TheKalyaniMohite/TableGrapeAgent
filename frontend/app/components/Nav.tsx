'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Language } from '@/app/lib/i18n';
import { getTranslation } from '@/app/lib/i18n';
import Logo from './Logo';
import { useState } from 'react';

interface NavProps {
  lang: Language;
}

export default function Nav({ lang }: NavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/setup', key: 'nav.setup' },
    { href: '/dashboard', key: 'nav.dashboard' },
    { href: '/chat', key: 'nav.chat' },
    { href: '/scan', key: 'nav.scan' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center"
          >
            <Logo showText={true} size="md" variant="nav" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  {getTranslation(item.key, lang)}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-3 py-2 rounded-lg text-sm font-medium transition-colors mx-1 my-0.5
                    ${isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  {getTranslation(item.key, lang)}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
