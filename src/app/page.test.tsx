import { render, screen } from '@testing-library/react';

import HomePage from './page';

describe('HomePage', () => {
  it('renders the hero, popular tools and categories', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Developer tools that run in your browser/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Popular tools' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Browse by category' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(20);
  });
});
