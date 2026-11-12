import Link from 'next/link';

import { AnalyticsPreview } from '@/components/analytics/AnalyticsPreview';
import { Logo } from '@/components/Logo';
import { Container } from '@/components/ui/Container';
import { catalog, totalToolCount } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';

const half = Math.ceil(catalog.length / 2);

export const Footer = () => (
  <footer className="mt-16 border-t border-border bg-canvas-subtle/40">
    <Container className="py-10">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link
            className="inline-flex items-center text-fg hover:no-underline"
            href="/"
          >
            <Logo />
          </Link>
          <p className="mt-3 max-w-sm text-xs leading-5 text-fg-muted">
            {totalToolCount}+ developer tools for formatting, converting,
            validating, hashing and inspecting code and data.
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            Everything runs locally in your browser.
          </p>
        </div>

        {[catalog.slice(0, half), catalog.slice(half)].map(
          (categoryGroup, index) => (
            <nav
              aria-label={index === 0 ? 'Categories' : 'More categories'}
              className="grid content-start gap-1.5"
              key={index}
            >
              {categoryGroup.map((category) => (
                <Link
                  className="text-xs text-fg-muted hover:text-accent hover:no-underline"
                  href={`/tools/${category.id}/`}
                  key={category.id}
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          )
        )}
      </div>

      <div className="mt-8">
        <AnalyticsPreview />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-xs text-fg-muted">
        <p>
          © {new Date().getFullYear()} {AppConfig.siteName}. Built for
          developers.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/tools/"
          >
            All tools
          </Link>
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/analytics/"
          >
            Analytics
          </Link>
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/about/"
          >
            About
          </Link>
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/privacy/"
          >
            Privacy
          </Link>
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/terms/"
          >
            Terms
          </Link>
          <Link
            className="text-fg-muted transition-colors hover:text-accent"
            href="/cookies/"
          >
            Cookies
          </Link>
          <a
            className="text-fg-muted transition-colors hover:text-accent"
            href="https://milinds.dev"
            rel="noreferrer"
            target="_blank"
          >
            milinds.dev
          </a>
        </div>
      </div>
    </Container>
  </footer>
);
