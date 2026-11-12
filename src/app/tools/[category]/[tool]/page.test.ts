import { generateMetadata, generateStaticParams } from './page';

describe('tool route metadata', () => {
  it('generates a static param for every tool', () => {
    expect(generateStaticParams()).toHaveLength(190);
  });

  it('builds metadata for a tool', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: 'crypto', tool: 'sha' }),
    });

    expect(metadata.title).toBe('SHA hash generator');
    expect(metadata.description).toContain('SHA hash generator');
    expect(metadata.alternates?.canonical).toBe('/tools/crypto/sha/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      url: '/tools/crypto/sha/',
    });
  });

  it('returns empty metadata for an unknown tool', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({
        category: 'crypto',
        tool: 'does-not-exist',
      }),
    });

    expect(metadata).toEqual({});
  });
});
