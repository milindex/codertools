import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { usePresence } from '@/hooks/usePresence';
import { analyticsFixture } from '@/test/fixtures/analytics';

import { AnalyticsPreview } from './AnalyticsPreview';

jest.mock('@/hooks/usePresence', () => ({
  usePresence: jest.fn(),
}));

const mockedUsePresence = usePresence as jest.Mock;

describe('AnalyticsPreview', () => {
  beforeEach(() => {
    mockedUsePresence.mockReturnValue({
      data: analyticsFixture,
      loading: false,
      returning: false,
      visitorId: 'visitor-1',
      initialized: true,
      refresh: jest.fn(),
    });
  });

  it('shows the live counts and expands the detail panel', async () => {
    const user = userEvent.setup();
    render(<AnalyticsPreview />);

    expect(screen.getByText('Live analytics')).toBeInTheDocument();
    expect(screen.getAllByText('1,234').length).toBeGreaterThan(0);
    expect(screen.getAllByText('5,678').length).toBeGreaterThan(0);

    const toggle = screen.getByRole('button', { name: /Live analytics/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('View the full dashboard')).toBeInTheDocument();
    expect(screen.getByText('34%')).toBeInTheDocument();
  });

  it('shows dashes when analytics has not loaded', () => {
    mockedUsePresence.mockReturnValue({
      data: null,
      loading: true,
      returning: false,
      visitorId: '',
      initialized: true,
      refresh: jest.fn(),
    });

    render(<AnalyticsPreview />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});
