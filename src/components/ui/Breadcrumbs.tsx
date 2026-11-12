import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav aria-label="Breadcrumb">
    <ol className="flex flex-wrap items-center gap-1 text-xs text-fg-muted">
      <li>
        <Link className="text-fg-muted hover:text-accent" href="/">
          Home
        </Link>
      </li>
      {items.map((item) => (
        <li className="flex items-center gap-1" key={item.label}>
          <ChevronRight aria-hidden className="h-3 w-3 text-fg-subtle" />
          {item.href ? (
            <Link className="text-fg-muted hover:text-accent" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="text-fg">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);
