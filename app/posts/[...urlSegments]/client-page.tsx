'use client';
import React from 'react';
import Image from 'next/image';
import { tinaField, useTina } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { PostQuery } from '@/tina/__generated__/types';
import { Section } from '@/components/layout/section';
import { components } from '@/components/mdx-components';
import { KwRating } from '@/components/kw-rating';
import { KwSignoff } from '@/components/kw-signoff';
import ErrorBoundary from '@/components/error-boundary';
import { formatDate } from '@/lib/format-date';

interface ClientPostProps {
  data: PostQuery;
  variables: {
    relativePath: string;
  };
  query: string;
}

export default function PostClientPage(props: ClientPostProps) {
  const { data } = useTina({ ...props });
  const post = data.post;

  return (
    <ErrorBoundary>
      <Section>
        <article className='mx-auto w-full max-w-3xl px-6'>
          <p className='kw-mono text-center text-[var(--kw-accent)]' data-tina-field={tinaField(post, 'date')}>
            {formatDate(post.date)}
          </p>
          <h1 data-tina-field={tinaField(post, 'title')} className='kw-display mt-3 text-center text-[clamp(2rem,6vw,3.5rem)] text-[var(--kw-ink)]'>
            {post.title}
          </h1>

          {post.heroImg && (
            <div data-tina-field={tinaField(post, 'heroImg')} className='mt-8 overflow-hidden rounded-2xl border kw-rule bg-[var(--kw-card)]'>
              <Image priority={true} src={post.heroImg} alt={post.title} width={1200} height={800} className='h-auto w-full object-cover' />
            </div>
          )}

          <div data-tina-field={tinaField(post, '_body')} className='prose dark:prose-dark mt-10 w-full max-w-none'>
            <TinaMarkdown content={post._body} components={{ ...components }} />
          </div>

          <div data-tina-field={tinaField(post, 'rating')} className='mt-10'>
            <KwRating value={post.rating} why={post.ratingWhy} />
          </div>

          <KwSignoff name={post.author?.name ? `Kawaii ${post.author.name}` : undefined} />
        </article>
      </Section>
    </ErrorBoundary>
  );
}
