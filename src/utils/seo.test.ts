import { catalog } from '@/data/catalog';
import { AppConfig } from '@/utils/AppConfig';
import {
  breadcrumbJsonLd,
  buildCategoryDescription,
  buildToolDescription,
  categoryJsonLd,
  categoryMetadata,
  toolJsonLd,
  toolMetadata,
} from '@/utils/seo';

const cryptoCategory = catalog.find((category) => category.id === 'crypto')!;
const shaTool = cryptoCategory.tools.find((tool) => tool.slug === 'sha')!;

describe('SEO helpers', () => {
  it('builds unique descriptions for every tool', () => {
    const descriptions = catalog.flatMap((category) =>
      category.tools.map((tool) => buildToolDescription(tool, category))
    );

    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(buildToolDescription(shaTool, cryptoCategory)).toContain(
      shaTool.name
    );
    expect(buildToolDescription(shaTool, cryptoCategory)).toContain(
      cryptoCategory.name
    );
  });

  it('builds category descriptions', () => {
    const description = buildCategoryDescription(cryptoCategory);
    expect(description).toContain(cryptoCategory.name);
    expect(description).toContain('CoderTools');
  });

  it('builds complete tool metadata', () => {
    const metadata = toolMetadata(shaTool, cryptoCategory);

    expect(metadata.title).toBe(shaTool.name);
    expect(metadata.description).toContain(shaTool.name);
    expect(metadata.alternates?.canonical).toBe('/tools/crypto/sha/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.keywords).toContain(shaTool.name);
    expect(metadata.openGraph).toMatchObject({
      title: `${shaTool.name} · ${AppConfig.siteName}`,
      url: '/tools/crypto/sha/',
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
    });
  });

  it('builds complete category metadata', () => {
    const metadata = categoryMetadata(cryptoCategory);

    expect(metadata.title).toBe(`${cryptoCategory.name} tools`);
    expect(metadata.description).toContain(cryptoCategory.name);
    expect(metadata.alternates?.canonical).toBe('/tools/crypto/');
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it('builds SoftwareApplication JSON-LD for a tool', () => {
    const jsonLd = toolJsonLd(shaTool, cryptoCategory);

    expect(jsonLd['@type']).toBe('SoftwareApplication');
    expect(jsonLd.name).toBe(shaTool.name);
    expect(jsonLd.url).toBe(`${AppConfig.url}/tools/crypto/sha/`);
    expect(jsonLd.applicationCategory).toBe('DeveloperApplication');
    expect(jsonLd.offers).toMatchObject({
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    });
    expect(jsonLd.isPartOf).toMatchObject({
      '@type': 'WebSite',
      name: AppConfig.siteName,
    });
  });

  it('builds CollectionPage and ItemList JSON-LD for a category', () => {
    const jsonLd = categoryJsonLd(cryptoCategory);

    expect(jsonLd['@type']).toBe('CollectionPage');
    expect(jsonLd.url).toBe(`${AppConfig.url}/tools/crypto/`);
    expect(jsonLd.mainEntity['@type']).toBe('ItemList');
    expect(jsonLd.mainEntity.numberOfItems).toBe(cryptoCategory.tools.length);
    expect(jsonLd.mainEntity.itemListElement[0]?.position).toBe(1);
  });

  it('builds breadcrumb JSON-LD in order', () => {
    const jsonLd = breadcrumbJsonLd([
      { name: 'Home', url: `${AppConfig.url}/` },
      { name: 'Tools', url: `${AppConfig.url}/tools/` },
    ]);

    expect(jsonLd['@type']).toBe('BreadcrumbList');
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[0]).toMatchObject({
      position: 1,
      name: 'Home',
    });
    expect(jsonLd.itemListElement[1]).toMatchObject({
      position: 2,
      name: 'Tools',
    });
  });
});
