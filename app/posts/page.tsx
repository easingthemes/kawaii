import Layout from '@/components/layout/layout';
import client from '@/tina/__generated__/client';
import PostsClientPage from './client-page';

// Content is read from the repo at build time (see vercel.json — the build runs
// `--content=local`), so there is nothing for a runtime re-render to fetch that the
// build did not already have. Revalidating anyway sends a query to TinaCloud on a
// live request, and when that fails the page is replaced by a 404 that then gets
// cached — which is exactly what happened on the first TinaCloud deploy.
//
// Publishing still works: saving in /admin commits to the repo, which triggers a
// Vercel build, which regenerates these pages.
export const revalidate = false;

export default async function PostsPage() {
  let posts = await client.queries.postConnection({
    sort: 'date',
    last: 1
  });
  const allPosts = posts;

  if (!allPosts.data.postConnection.edges) {
    return [];
  }

  while (posts.data?.postConnection.pageInfo.hasPreviousPage) {
    posts = await client.queries.postConnection({
      sort: 'date',
      before: posts.data.postConnection.pageInfo.endCursor,
    });

    if (!posts.data.postConnection.edges) {
      break;
    }

    allPosts.data.postConnection.edges.push(...posts.data.postConnection.edges.reverse());
  }

  return (
    <Layout rawPageData={allPosts.data}>
      <PostsClientPage {...allPosts} />
    </Layout>
  );
}
