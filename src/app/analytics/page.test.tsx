import { render, screen } from '@testing-library/react';

import { usePresence } from '@/hooks/usePresence';
import { analyticsFixture } from '@/test/fixtures/analytics';

import AnalyticsPage from './page';

jest.mock('@/hooks/usePresence', () => ({
  usePresence: jest.fn(),
}));

const mockedUsePresence = usePresence as jest.Mock;

describe('AnalyticsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedUsePresence.mockReturnValue({
      data: analyticsFixture,
      loading: false,
      returning: false,
      visitorId: 'visitor-1',
      initialized: true,
      refresh: jest.fn(),
    });
  });

  it('renders the dashboard sections', () => {
    render(<AnalyticsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Live analytics' })
    ).toBeInTheDocument();
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Reach')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Recent activity')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('crypto/sha')).toBeInTheDocument();
  });
});
