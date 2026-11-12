import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { catalog } from '@/data/catalog';

import { ToolsDirectory } from './ToolsDirectory';

describe('ToolsDirectory', () => {
  it('filters tools by search', async () => {
    const user = userEvent.setup();
    render(<ToolsDirectory categories={catalog} />);

    expect(screen.getByText('SHA hash generator')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Search tools'),
      'SHA hash generator'
    );

    await waitFor(() => {
      expect(screen.getByText('SHA hash generator')).toBeInTheDocument();
      expect(screen.queryByText('HTML formatter')).not.toBeInTheDocument();
    });
  });

  it('filters tools by category', async () => {
    const user = userEvent.setup();
    render(<ToolsDirectory categories={catalog} />);

    await user.click(
      screen.getByRole('button', { name: /Hashing & Cryptography/ })
    );

    await waitFor(() => {
      expect(screen.getByText('SHA hash generator')).toBeInTheDocument();
      expect(screen.queryByText('HTML formatter')).not.toBeInTheDocument();
    });
  });

  it('shows an empty state for an unmatched search', async () => {
    const user = userEvent.setup();
    render(<ToolsDirectory categories={catalog} />);

    await user.type(
      screen.getByLabelText('Search tools'),
      'this-tool-does-not-exist'
    );

    expect(await screen.findByText('No tools found')).toBeInTheDocument();
  });
});
