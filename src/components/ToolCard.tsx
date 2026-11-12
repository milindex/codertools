import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

import { CategoryIcon } from '@/components/CategoryIcon';
import type { ToolDefinition } from '@/data/catalog';

type ToolCardProps = {
  tool: ToolDefinition & {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
  };
  showCategory?: boolean;
};

export const ToolCard = ({ tool, showCategory = false }: ToolCardProps) => (
  <Link
    className="ct-card group flex h-full flex-col rounded-lg border border-border bg-surface p-4"
    href={`/tools/${tool.categoryId}/${tool.slug}/`}
  >
    <div className="flex items-start justify-between gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-canvas-subtle text-fg-muted transition-colors group-hover:border-accent/40 group-hover:bg-accent-subtle/30 group-hover:text-accent">
        <CategoryIcon className="h-4 w-4" name={tool.categoryIcon} />
      </span>
      <ArrowUpRight
        aria-hidden
        className="h-4 w-4 text-fg-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </div>

    <div className="mt-3 flex-1">
      <h3 className="text-sm font-semibold text-fg transition-colors group-hover:text-accent">
        {tool.name}
      </h3>
      <p className="mt-1 text-xs leading-5 text-fg-muted">{tool.description}</p>
    </div>

    {showCategory && (
      <p className="mt-3 border-t border-border-muted pt-2 text-[11px] font-medium text-fg-subtle">
        {tool.categoryName}
      </p>
    )}
  </Link>
);
