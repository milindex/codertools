import { render, screen } from '@testing-library/react';

import CookiesPage, { metadata as cookiesMetadata } from './cookies/page';
import PrivacyPage, { metadata as privacyMetadata } from './privacy/page';
import TermsPage, { metadata as termsMetadata } from './terms/page';

describe('legal pages', () => {
  it('exposes metadata for all legal pages', () => {
    expect(privacyMetadata.title).toBe('Privacy Policy');
    expect(termsMetadata.title).toBe('Terms of Service');
    expect(cookiesMetadata.title).toBe('Cookie Policy');

    expect(privacyMetadata.robots).toEqual({ index: true, follow: true });
    expect(termsMetadata.robots).toEqual({ index: true, follow: true });
    expect(cookiesMetadata.robots).toEqual({ index: true, follow: true });
  });

  it('renders the privacy policy', () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })
    ).toBeInTheDocument();
    expect(screen.getByText('Short version')).toBeInTheDocument();
    expect(screen.getByText('Information we process')).toBeInTheDocument();
  });

  it('renders the terms of service', () => {
    render(<TermsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms of Service' })
    ).toBeInTheDocument();
    expect(screen.getByText('No warranty')).toBeInTheDocument();
  });

  it('renders the cookie policy', () => {
    render(<CookiesPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cookie Policy' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('What we store in your browser')
    ).toBeInTheDocument();
  });
});
