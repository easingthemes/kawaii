import type { Metadata } from 'next';

export const SITE_URL = 'https://kawaii.vercel.app';
export const SITE_NAME = 'Kawaii';
export const SITE_DESCRIPTION = 'Kawaii — a site edited straight from the browser.';

/** Fallback share image. Square, so it is declared as such rather than lied about as 1200x630. */
export const DEFAULT_OG_IMAGE = { url: '/uploads/posts/main.jpg', width: 1024, height: 1024 };

type PageSeo = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  noindex?: boolean | null;
} | null;

/**
 * Builds per-route metadata from a Tina page document.
 *
 * Every field is optional in the CMS, so each one falls back to the site default —
 * a page with an empty SEO group still gets a correct canonical URL and share card.
 */
export function pageMetadata({
  seo,
  title,
  path,
}: {
  seo?: PageSeo;
  title?: string | null;
  path: string;
}): Metadata {
  const resolvedTitle = seo?.title || title || SITE_NAME;
  const description = seo?.description || SITE_DESCRIPTION;
  const image = seo?.image ? { url: seo.image } : DEFAULT_OG_IMAGE;
  const url = path === '/' ? '/' : path;

  return {
    // `title.absolute` skips the "%s | Kawaii" template — the home page is already
    // called Kawaii, and inner pages carry the site name in their own SEO title when they want it.
    title: { absolute: resolvedTitle },
    description,
    alternates: { canonical: url },
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: resolvedTitle,
      description,
      url,
      locale: 'en_US',
      images: [{ ...image, alt: resolvedTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: [image.url],
    },
  };
}
