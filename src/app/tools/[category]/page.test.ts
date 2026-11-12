import { generateMetadata, generateStaticParams } from './page';

describe('category route metadata', () => {
  it('generates a static param for every category', () => {
    expect(generateStaticParams()).toHaveLength(18);
  });

  it('builds metadata for a category', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: 'crypto' }),
    });

    expect(metadata.title).toBe('Hashing & Cryptography tools');
    expect(metadata.description).toContain('Hashing & Cryptography');
    expect(metadata.alternates?.canonical).toBe('/tools/crypto/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('returns empty metadata for an unknown category', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: 'does-not-exist' }),
    });

    expect(metadata).toEqual({});
  });
});
