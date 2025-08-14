import Script from 'next/script';
import { Asset } from '@/types/asset';

interface DesignStructuredDataProps {
  asset: Asset;
}

export function DesignStructuredData({ asset }: DesignStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b-design-stash.vercel.app';
  const pageUrl = `${siteUrl}/design/${asset.slug}`;
  
  const creativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': pageUrl,
    name: asset.title,
    description: `${asset.category} design by ${asset.company}. ${asset.tags.join(', ')}`,
    url: pageUrl,
    image: {
      '@type': 'ImageObject',
      url: asset.file_url,
      description: `${asset.title} - ${asset.category} design screenshot`
    },
    creator: {
      '@type': asset.made_by_db ? 'Organization' : 'Person',
      name: asset.made_by_db ? 'Design Buffs' : asset.company,
      url: asset.made_by_db ? 'https://designbuffs.com' : asset.source_url
    },
    publisher: {
      '@type': 'Organization',
      name: 'Design Buffs',
      url: 'https://designbuffs.com',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/design-buffs-logo.png`,
        width: 400,
        height: 400
      }
    },
    dateCreated: asset.created_at,
    datePublished: asset.created_at,
    inLanguage: 'en-US',
    genre: asset.category,
    keywords: [
      asset.title,
      asset.company,
      asset.category,
      ...asset.tags,
      ...asset.design_style,
      'B2B design',
      'design inspiration'
    ].join(', '),
    about: {
      '@type': 'Thing',
      name: asset.category,
      description: `B2B ${asset.category} design examples`
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'B2B Design Stash',
      url: siteUrl
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Design Gallery',
        item: siteUrl
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: asset.title,
        item: pageUrl
      }
    ]
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${asset.source_url}#organization`,
    name: asset.company,
    url: asset.source_url,
    sameAs: asset.source_url ? [asset.source_url] : undefined
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: `${asset.title} - B2B Design Stash`,
    description: `${asset.category} design by ${asset.company}. Real B2B design inspiration curated by Design Buffs.`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}#website`
    },
    about: {
      '@type': 'CreativeWork',
      '@id': pageUrl
    },
    mainEntity: {
      '@type': 'CreativeWork',
      '@id': pageUrl
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const schemas: Array<Record<string, any>> = [
    creativeWorkSchema,
    breadcrumbSchema,
    webPageSchema
  ];

  // Only add organization schema if we have a source URL
  if (asset.source_url && !asset.made_by_db) {
    schemas.push(organizationSchema);
  }

  return (
    <Script
      id="design-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
}