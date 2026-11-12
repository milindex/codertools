import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { CategoryDefinition } from '@/data/catalog';

export const CategoryCard = ({
  category,
}: {
  category: CategoryDefinition;
}) => (
  <Link
    className="ct-card group flex h-full flex-col rounded-lg border border-border bg-surface p-4"
    href={`/tools/${category.id}/`}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-canvas-subtle text-fg-muted transition-colors group-hover:border-accent/40 group-hover:bg-accent-subtle/30 group-hover:text-accent">
        <CategoryIcon name={category.icon} />
      </span>
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
        {category.tools.length} tools
        <ArrowUpRight
          aria-hidden
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </span>
    </div>

    <h3 className="mt-3 text-sm font-semibold text-fg transition-colors group-hover:text-accent">
      {category.name}
    </h3>
    <p className="mt-1 flex-1 text-xs leading-5 text-fg-muted">
      {category.description}
    </p>
  </Link>
);
