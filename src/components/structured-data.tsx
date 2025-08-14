import Script from 'next/script';

export function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b-design-stash.vercel.app';
  
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'B2B Design Stash',
    alternateName: 'B2B Design Gallery',
    description: 'Real B2B design inspiration gallery curated by Design Buffs. Skip the hype and see work that converts.',
    url: siteUrl,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      '@id': 'https://designbuffs.com/#organization',
      name: 'Design Buffs',
      url: 'https://designbuffs.com',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/design-buffs-logo.png`,
        width: 400,
        height: 400
      }
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://designbuffs.com/#organization',
    name: 'Design Buffs',
    alternateName: 'DesignBuffs',
    url: 'https://designbuffs.com',
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/design-buffs-logo.png`,
      width: 400,
      height: 400
    },
    sameAs: [
      'https://twitter.com/designbuffs'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@designbuffs.com'
    }
  };

  const creativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${siteUrl}/#collectionpage`,
    name: 'B2B Design Gallery',
    description: 'Curated collection of real B2B design examples from successful companies',
    url: siteUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: 'B2B Design Examples',
      description: 'Collection of B2B design inspiration including brand identity, web design, sales materials, and marketing assets',
      numberOfItems: 'variable'
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl
        }
      ]
    }
  };

  const schemas = [websiteSchema, organizationSchema, creativeWorkSchema];

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}