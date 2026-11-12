import { render, screen } from '@testing-library/react';

import OfflinePage, { metadata } from './page';

describe('OfflinePage', () => {
  it('is excluded from search engines', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('renders the offline fallback', () => {
    render(<OfflinePage />);

    expect(
      screen.getByRole('heading', { name: 'You are offline' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not cached for offline use yet/i)
    ).toBeInTheDocument();
  });
});
