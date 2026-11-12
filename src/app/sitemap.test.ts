import { AppConfig } from '@/utils/AppConfig';

import sitemap from './sitemap';

describe('sitemap', () => {
  it('includes every indexable page and tool', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(entries).toHaveLength(214);
    expect(urls).toContain(`${AppConfig.url}/`);
    expect(urls).toContain(`${AppConfig.url}/tools/`);
    expect(urls).toContain(`${AppConfig.url}/about/`);
    expect(urls).toContain(`${AppConfig.url}/privacy/`);
    expect(urls).toContain(`${AppConfig.url}/terms/`);
    expect(urls).toContain(`${AppConfig.url}/cookies/`);
    expect(urls).toContain(`${AppConfig.url}/tools/crypto/`);
    expect(urls).toContain(`${AppConfig.url}/tools/crypto/sha/`);
  });

  it('excludes private and metadata routes', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).not.toContain(`${AppConfig.url}/analytics/`);
    expect(urls).not.toContain(`${AppConfig.url}/offline/`);
  });
});
