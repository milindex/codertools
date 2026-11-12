import { ChevronDown, Menu, Search } from 'lucide-react';
import Link from 'next/link';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Logo } from '@/components/Logo';
import { AutoCloseDetails } from '@/components/site/AutoCloseDetails';
import { ThemeToggle } from '@/components/site/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { catalog, totalToolCount } from '@/data/catalog';

const primaryLinks = [
  { href: '/tools', label: 'Tools' },
  { href: '/tools/encoding', label: 'Encoding' },
  { href: '/tools/crypto', label: 'Crypto' },
  { href: '/tools/generators', label: 'Generators' },
  { href: '/tools/data', label: 'Data' },
  { href: '/about', label: 'About' },
];

const SearchForm = ({
  className,
  id = 'site-search',
}: {
  className?: string;
  id?: string;
}) => (
  <form action="/tools" className={className} method="get">
    <label className="sr-only" htmlFor={id}>
      Search tools
    </label>
    <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-canvas-inset px-2.5 transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
      <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
      <input
        autoComplete="off"
        className="w-full min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
        id={id}
        name="q"
        placeholder="Search tools…"
        type="search"
      />
    </div>
  </form>
);

const CategoryMenu = () => (
  <div className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-2">
    {catalog.map((category) => (
      <Link
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg hover:no-underline"
        href={`/tools/${category.id}/`}
        key={category.id}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border bg-canvas-subtle">
          <CategoryIcon className="h-3.5 w-3.5" name={category.icon} />
        </span>
        <span className="min-w-0 flex-1 truncate">{category.name}</span>
        <span className="text-[10px] text-fg-subtle">
          {category.tools.length}
        </span>
      </Link>
    ))}
  </div>
);

export const Header = () => (
  <header className="sticky top-0 z-40 border-b border-border bg-canvas/95 backdrop-blur">
    <Container>
      <div className="flex h-14 items-center gap-3">
        <Link
          className="flex shrink-0 items-center text-fg hover:no-underline"
          href="/"
        >
          <Logo />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {primaryLinks.slice(0, 1).map((link) => (
            <Link
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg hover:no-underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}

          <AutoCloseDetails className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-muted hover:bg-surface-hover hover:text-fg [&::-webkit-details-marker]:hidden">
              Browse
              <ChevronDown
                aria-hidden
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="ct-menu-in absolute left-0 top-full z-50 mt-2 w-[min(92vw,560px)] overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border bg-canvas-subtle/60 px-3 py-2">
                <span className="text-xs font-semibold text-fg-muted">
                  All categories
                </span>
                <Badge variant="accent">{totalToolCount} tools</Badge>
              </div>
              <CategoryMenu />
            </div>
          </AutoCloseDetails>

          {primaryLinks.slice(1).map((link) => (
            <Link
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg hover:no-underline"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchForm
            className="hidden w-52 sm:block lg:w-64"
            id="header-search"
          />
          <ThemeToggle />
          <AutoCloseDetails className="group relative lg:hidden">
            <summary
              aria-label="Open menu"
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-canvas-subtle text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden className="h-4 w-4" />
            </summary>
            <div className="ct-menu-in absolute right-0 top-full z-50 mt-2 w-[min(92vw,320px)] overflow-hidden rounded-lg border border-border bg-surface shadow-2xl">
              <div className="border-b border-border p-2">
                <SearchForm id="mobile-search" />
              </div>
              <nav aria-label="Mobile navigation" className="p-1">
                {primaryLinks.map((link) => (
                  <Link
                    className="block rounded-md px-2 py-1.5 text-xs text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg hover:no-underline"
                    href={link.href}
                    key={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border">
                <CategoryMenu />
              </div>
            </div>
          </AutoCloseDetails>
        </div>
      </div>

      <div className="pb-2 sm:hidden">
        <SearchForm id="mobile-search-row" />
      </div>
    </Container>
  </header>
);
