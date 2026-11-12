import { render, screen } from '@testing-library/react';

import ToolsPage from './page';

describe('ToolsPage', () => {
  it('renders the tool directory and search', () => {
    render(<ToolsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'All tools' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('190 tools').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Search tools')).toBeInTheDocument();
  });
});
