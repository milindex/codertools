import Link from 'next/link';

import { AppConfig } from '@/utils/AppConfig';

const navigation = [
  { href: '/html', label: 'HTML' },
  { href: '/css', label: 'CSS' },
  { href: '/js', label: 'JS' },
  { href: '/json', label: 'JSON' },
  { href: '/others', label: 'Other' },
  { href: '/about', label: 'About' },
];

export const Header = () => (
  <header className="border-b border-gray-300 bg-white">
    <div className="mx-auto flex max-w-screen-lg flex-wrap items-center justify-between gap-4 px-4 py-4">
      <Link
        className="border-none text-xl font-bold text-gray-900 hover:text-gray-700 hover:no-underline"
        href="/"
      >
        {AppConfig.siteName}
      </Link>

      <nav aria-label="Main navigation">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-base">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                className="border-none text-gray-700 hover:text-gray-900 hover:no-underline"
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
);
