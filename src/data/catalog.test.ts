import fs from 'node:fs';
import path from 'node:path';

import {
  allTools,
  catalog,
  popularTools,
  totalToolCount,
} from '@/data/catalog';

describe('catalog integrity', () => {
  it('contains every category and tool', () => {
    expect(catalog).toHaveLength(18);
    expect(totalToolCount).toBe(190);
    expect(allTools).toHaveLength(190);
    expect(popularTools.length).toBeGreaterThan(0);
  });

  it('has unique category ids and tool slugs', () => {
    const categoryIds = catalog.map((category) => category.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);

    for (const category of catalog) {
      const slugs = category.tools.map((tool) => tool.slug);
      expect(new Set(slugs).size).toBe(slugs.length);

      for (const slug of slugs) {
        expect(slug).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it('has unique tool names and descriptions', () => {
    const names = allTools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);

    const descriptions = allTools.map((tool) => tool.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('has a meaningful description for every tool', () => {
    for (const tool of allTools) {
      expect(tool.description.length).toBeGreaterThanOrEqual(10);
      expect(tool.name.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('maps every catalog tool to a category component', () => {
    for (const category of catalog) {
      const indexPath = path.join(
        process.cwd(),
        'src',
        'tools',
        category.id,
        'index.ts'
      );
      const source = fs.readFileSync(indexPath, 'utf8');
      const componentsAt = source.indexOf('components');
      const open = source.indexOf('{', componentsAt);
      const close = source.lastIndexOf('};');
      const body = source.slice(open + 1, close);
      const keys = new Set(
        [...body.matchAll(/^\s*(?:'([^']+)'|([a-z0-9-]+))\s*:/gm)].map(
          (match) => match[1] || match[2]
        )
      );

      expect([...keys].sort()).toEqual(
        category.tools.map((tool) => tool.slug).sort()
      );
    }
  });
});
