'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import { CategoryIcon } from '@/components/CategoryIcon';
import { ToolCard } from '@/components/ToolCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import type { CategoryDefinition } from '@/data/catalog';
import { allTools, totalToolCount } from '@/data/catalog';
import { cn } from '@/utils/cn';

type SortMode = 'popular' | 'name';

export const ToolsDirectory = ({
  categories,
}: {
  categories: CategoryDefinition[];
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortMode>('popular');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    const initialCategory = params.get('category');
    if (initialQuery) {
      setQuery(initialQuery);
    }
    if (
      initialCategory &&
      categories.some((item) => item.id === initialCategory)
    ) {
      setCategory(initialCategory);
    }
  }, [categories]);

  const filteredTools = useMemo(() => {
    const result = allTools.filter((tool) => {
      const matchesCategory =
        category === 'all' || tool.categoryId === category;
      if (!matchesCategory) {
        return false;
      }
      if (!deferredQuery) {
        return true;
      }
      const haystack = [
        tool.name,
        tool.description,
        tool.categoryName,
        ...(tool.keywords ?? []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(deferredQuery);
    });

    return result.sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      const priorityA = a.priority ?? 3;
      const priorityB = b.priority ?? 3;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [category, deferredQuery, sort]);

  const activeCategory = categories.find((item) => item.id === category);
  const hasFilters = Boolean(deferredQuery) || category !== 'all';

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          <SlidersHorizontal aria-hidden className="h-3.5 w-3.5" />
          Categories
        </div>
        <nav
          aria-label="Tool categories"
          className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
        >
          <button
            className={cn(
              'flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors lg:w-full',
              category === 'all'
                ? 'border-accent/40 bg-accent-subtle/40 text-accent'
                : 'border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg'
            )}
            onClick={() => setCategory('all')}
            type="button"
          >
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-canvas-subtle text-[10px]">
                ∗
              </span>
              All tools
            </span>
            <span className="text-[10px] text-fg-subtle">{totalToolCount}</span>
          </button>

          {categories.map((item) => (
            <button
              className={cn(
                'flex shrink-0 cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-medium transition-colors lg:w-full',
                category === item.id
                  ? 'border-accent/40 bg-accent-subtle/40 text-accent'
                  : 'border-transparent text-fg-muted hover:bg-surface-hover hover:text-fg'
              )}
              key={item.id}
              onClick={() => setCategory(item.id)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-border bg-canvas-subtle">
                  <CategoryIcon className="h-3 w-3" name={item.icon} />
                </span>
                {item.name}
              </span>
              <span className="text-[10px] text-fg-subtle">
                {item.tools.length}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle"
            />
            <input
              aria-label="Search tools"
              className="h-8 w-full rounded-md border border-border bg-canvas-inset pl-8 pr-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-1 focus:ring-accent"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, description or keyword…"
              type="search"
              value={query}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              className="shrink-0 text-xs text-fg-muted"
              htmlFor="tool-sort"
            >
              Sort
            </label>
            <Select
              className="w-40"
              id="tool-sort"
              onChange={(event) => setSort(event.target.value as SortMode)}
              value={sort}
            >
              <option value="popular">Popular first</option>
              <option value="name">A–Z</option>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-fg-muted">
            Showing{' '}
            <span className="font-semibold text-fg">
              {filteredTools.length}
            </span>{' '}
            {filteredTools.length === 1 ? 'tool' : 'tools'}
            {activeCategory ? ` in ${activeCategory.name}` : ''}
            {deferredQuery ? ` for “${query.trim()}”` : ''}
          </p>
          {hasFilters && (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              <X aria-hidden className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {filteredTools.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <ToolCard
                key={`${tool.categoryId}/${tool.slug}`}
                showCategory={category === 'all'}
                tool={tool}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={clearFilters} size="sm">
                Clear filters
              </Button>
            }
            className="mt-3"
            description="Try a different search term or category."
            icon={Search}
            title="No tools found"
          />
        )}
      </div>
    </div>
  );
};
