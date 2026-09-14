import React from 'react';
import { notFound } from 'next/navigation';
import client from '@/tina/__generated__/client';
import ClientPage from './client-page';

export const revalidate = 300;

export default async function Page({ params }: { params: Promise<{ urlSegments: string[] }> }) {
  const resolvedParams = await params;
  const filepath = resolvedParams.urlSegments.join('/');

  // useTina() in the client component returns no error state, so a missing
  // document has to be turned into a 404 here, on the server.
  let data: Awaited<ReturnType<typeof client.queries.page>>;
  try {
    data = await client.queries.page({
      relativePath: `${filepath}.mdx`,
    });
  } catch {
    notFound();
  }

  return <ClientPage {...data} />;
}

export async function generateStaticParams() {
  let pages = await client.queries.pageConnection();
  const allPages = pages;

  if (!allPages.data.pageConnection.edges) {
    return [];
  }

  // pageConnection is cursor-paginated; walk it so every page gets prerendered.
  while (pages.data.pageConnection.pageInfo.hasNextPage) {
    pages = await client.queries.pageConnection({
      after: pages.data.pageConnection.pageInfo.endCursor,
    });

    if (!pages.data.pageConnection.edges) {
      break;
    }

    allPages.data.pageConnection.edges.push(...pages.data.pageConnection.edges);
  }

  return allPages.data.pageConnection.edges
    .map((edge) => ({
      urlSegments: edge?.node?._sys.breadcrumbs || [],
    }))
    .filter((x) => x.urlSegments.length >= 1)
    .filter((x) => !x.urlSegments.every((segment) => segment === 'home')); // home is served by app/page.tsx
}
