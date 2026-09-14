import React from 'react';
import type { Metadata } from 'next';
import client from '@/tina/__generated__/client';
import Layout from '@/components/layout/layout';
import { JsonLd, personJsonLd } from '@/lib/json-ld';
import { pageMetadata } from '@/lib/seo';
import ClientPage from './[...urlSegments]/client-page';

// Content is read from the repo at build time (see vercel.json — the build runs
// `--content=local`), so there is nothing for a runtime re-render to fetch that the
// build did not already have. Revalidating anyway sends a query to TinaCloud on a
// live request, and when that fails the page is replaced by a 404 that then gets
// cached — which is exactly what happened on the first TinaCloud deploy.
//
// Publishing still works: saving in /admin commits to the repo, which triggers a
// Vercel build, which regenerates these pages.
export const revalidate = false;

const home = () => client.queries.page({ relativePath: 'home.mdx' });

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await home();
  return pageMetadata({ seo: (data.page as any).seo, title: data.page.title, path: '/' });
}

export default async function Home() {
  const data = await home();

  return (
    <Layout rawPageData={data}>
      <JsonLd data={personJsonLd()} />
      <ClientPage {...data} />
    </Layout>
  );
}
