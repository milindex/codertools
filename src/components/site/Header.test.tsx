import { render, screen } from '@testing-library/react';

import { Header } from './Header';

describe('Header', () => {
  it('renders the brand, navigation and search', () => {
    render(<Header />);

    expect(
      screen.getByRole('link', { name: /Coder\s*Tools/ })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Tools' }).length
    ).toBeGreaterThan(0);
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(
      screen.getAllByPlaceholderText('Search tools…').length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: 'About' }).length
    ).toBeGreaterThan(0);
  });
});
