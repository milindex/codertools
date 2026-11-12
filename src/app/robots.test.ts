import { AppConfig } from '@/utils/AppConfig';

import robots from './robots';

describe('robots', () => {
  it('allows public pages, blocks private routes and points to the sitemap', () => {
    const result = robots();

    expect(result.rules).toEqual([
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/analytics/', '/offline/'],
      },
    ]);
    expect(result.sitemap).toBe(`${AppConfig.url}/sitemap.xml`);
    expect(result.host).toBe(AppConfig.url);
  });
});
