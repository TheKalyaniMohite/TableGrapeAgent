'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Language } from '@/app/lib/i18n';
import { getTranslation } from '@/app/lib/i18n';

interface NavProps {
  lang: Language;
}

export default function Nav({ lang }: NavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/setup', key: 'nav.setup' },
    { href: '/dashboard', key: 'nav.dashboard' },
    { href: '/chat', key: 'nav.chat' },
    { href: '/scan', key: 'nav.scan' },
  ];

  return (
    <nav className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          {getTranslation('app.title', lang)}
        </Link>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded ${
                pathname === item.href ? 'bg-green-700' : 'hover:bg-green-700'
              }`}
            >
              {getTranslation(item.key, lang)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}


