import { render, screen } from '@testing-library/react';

import { catalog } from '@/data/catalog';

import { ToolCard } from './ToolCard';

const category = catalog.find((item) => item.id === 'crypto')!;
const tool = {
  ...category.tools.find((item) => item.slug === 'sha')!,
  categoryId: category.id,
  categoryName: category.name,
  categoryIcon: category.icon,
};

describe('ToolCard', () => {
  it('links to the tool route and shows the tool details', () => {
    render(<ToolCard showCategory tool={tool} />);

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toMatch(/^\/tools\/crypto\/sha\/?$/);
    expect(screen.getByText(tool.name)).toBeInTheDocument();
    expect(screen.getByText(tool.description)).toBeInTheDocument();
    expect(screen.getByText(category.name)).toBeInTheDocument();
  });
});
