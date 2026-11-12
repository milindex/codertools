import { countryName, isKnownCountry } from '@/lib/analytics/countries';

describe('analytics country helpers', () => {
  it('accepts real two-letter country codes', () => {
    expect(isKnownCountry('IN')).toBe(true);
    expect(isKnownCountry('US')).toBe(true);
    expect(isKnownCountry('GB')).toBe(true);
  });

  it('rejects unknown, empty and non-country values', () => {
    expect(isKnownCountry('XX')).toBe(false);
    expect(isKnownCountry('T1')).toBe(false);
    expect(isKnownCountry('Unknown')).toBe(false);
    expect(isKnownCountry('n/a')).toBe(false);
    expect(isKnownCountry('')).toBe(false);
    expect(isKnownCountry(null)).toBe(false);
    expect(isKnownCountry(undefined)).toBe(false);
  });

  it('returns readable country names', () => {
    expect(countryName('IN')).toBe('India');
    expect(countryName('US')).toBe('United States');
    expect(countryName('XX')).toBe('Unknown');
  });
});
