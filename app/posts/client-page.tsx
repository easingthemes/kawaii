'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { PostConnectionQuery, PostConnectionQueryVariables } from '@/tina/__generated__/types';
import ErrorBoundary from '@/components/error-boundary';
import { Section } from '@/components/layout/section';
import { KwRatingBadge } from '@/components/kw-rating';
import { formatDate } from '@/lib/format-date';

interface ClientPostProps {
  data: PostConnectionQuery;
  variables: PostConnectionQueryVariables;
  query: string;
}

export default function PostsClientPage(props: ClientPostProps) {
  const posts = (props.data?.postConnection.edges ?? []).map((postData) => {
    const post = postData!.node!;

    return {
      id: post.id,
      published: formatDate(post.date),
      title: post.title,
      tags: post.tags?.map((tag) => tag?.tag?.name).filter(Boolean) || [],
      url: `/posts/${post._sys.breadcrumbs.join('/')}`,
      excerpt: post.excerpt,
      heroImg: post.heroImg,
      rating: post.rating,
    };
  });

  return (
    <ErrorBoundary>
      <Section>
        <div className='mx-auto w-full max-w-5xl px-6'>
          <div className='text-center'>
            <p className='kw-mono text-[var(--kw-accent)]'>Blog</p>
            <h1 className='kw-display mt-3 text-[clamp(2rem,6vw,3.5rem)] text-[var(--kw-ink)]'>Wo ich war</h1>
            <p className='kw-prose mx-auto mt-4 max-w-2xl'>Kurze Texte, ein Foto und eine Bewertung von 1 bis 10.</p>
          </div>

          {posts.length === 0 ? (
            <p className='kw-prose mt-12 text-center'>Noch nichts geschrieben.</p>
          ) : (
            <ul className='mt-12 grid gap-8 sm:grid-cols-2'>
              {posts.map((post) => (
                <li key={post.id} className='flex flex-col overflow-hidden rounded-2xl border kw-rule bg-[var(--kw-card)]'>
                  {post.heroImg && (
                    <Link href={post.url} className='block'>
                      <div className='aspect-[16/10] overflow-hidden'>
                        <Image
                          width={640}
                          height={400}
                          src={post.heroImg}
                          alt={post.title}
                          className='h-full w-full object-cover transition-opacity duration-200 hover:opacity-80'
                        />
                      </div>
                    </Link>
                  )}

                  <div className='flex flex-1 flex-col p-5 sm:p-6'>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
                      <p className='kw-mono text-[var(--kw-accent)]'>{post.published}</p>
                      <KwRatingBadge value={post.rating} />
                    </div>

                    <h2 className='kw-display mt-2 text-2xl text-[var(--kw-ink)]'>
                      <Link href={post.url} className='hover:text-[var(--kw-accent)]'>
                        {post.title}
                      </Link>
                    </h2>

                    <div className='kw-prose mt-3'>
                      <TinaMarkdown content={post.excerpt} />
                    </div>

                    {post.tags.length > 0 && (
                      <div className='kw-mono mt-4 flex flex-wrap gap-3 text-[var(--kw-ink-soft)]'>
                        {post.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={post.url}
                      className='kw-mono mt-5 inline-block self-start border-b border-[var(--kw-rule)] pb-1 text-[var(--kw-accent)] transition-colors hover:border-[var(--kw-accent)] hover:text-[var(--kw-ink)]'
                    >
                      Weiterlesen →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>
    </ErrorBoundary>
  );
}
