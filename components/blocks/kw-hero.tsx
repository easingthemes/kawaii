'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { PageBlocksKwHero } from '../../tina/__generated__/types';

export const KwHero = ({ data }: { data: PageBlocksKwHero }) => {
  return (
    <section className='kw-glow relative -mt-20 overflow-hidden border-b kw-rule'>
      {data.image?.src && (
        <div className='absolute inset-0 -z-10'>
          <Image
            src={data.image.src}
            alt={data.image.alt || ''}
            fill
            priority
            sizes='100vw'
            className='object-cover object-center opacity-40'
            data-tina-field={tinaField(data.image, 'src')}
          />
          {/* Keep the type readable over any cover: the covers are bright at the horizon. */}
          <div className='absolute inset-0 bg-gradient-to-t from-[var(--kw-bg)] via-[var(--kw-bg)]/75 to-[var(--kw-bg)]/40' />
        </div>
      )}

      <div className='mx-auto flex min-h-[78svh] max-w-5xl flex-col justify-end px-6 pb-20 pt-40 sm:pb-28'>
        {data.eyebrow && (
          <p className='kw-mono kw-rise' data-tina-field={tinaField(data, 'eyebrow')}>
            {data.eyebrow}
          </p>
        )}

        <h1
          className='kw-display kw-rise mt-6 text-[clamp(2.75rem,9vw,7rem)] text-[var(--kw-ink)]'
          data-tina-field={tinaField(data, 'name')}
        >
          {data.name}
        </h1>

        {data.tagline && (
          <p
            className='kw-rise mt-5 max-w-2xl text-lg text-[var(--kw-accent)] sm:text-xl'
            data-tina-field={tinaField(data, 'tagline')}
          >
            {data.tagline}
          </p>
        )}

        {data.intro && (
          <div className='kw-prose kw-rise mt-8 max-w-2xl' data-tina-field={tinaField(data, 'intro')}>
            <TinaMarkdown content={data.intro} />
          </div>
        )}

        {data.actions && data.actions.length > 0 && (
          <div className='kw-rise mt-10 flex flex-wrap items-center gap-x-8 gap-y-4'>
            {data.actions.map((action, i) => (
              <Link
                key={`${action?.label}-${i}`}
                href={action?.link || '#'}
                className='kw-mono border-b border-[var(--kw-rule)] pb-1 text-[var(--kw-accent)] transition-colors hover:border-[var(--kw-accent)] hover:text-[var(--kw-ink)]'
                data-tina-field={tinaField(action, 'label')}
              >
                {action?.label} →
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export const kwHeroBlockSchema: Template = {
  name: 'kwHero',
  label: 'Big intro (hero)',
  ui: {
    defaultItem: {
      eyebrow: 'Blog and events',
      name: 'Kaja',
    },
  },
  fields: [
    { type: 'string', label: 'Eyebrow', name: 'eyebrow' },
    { type: 'string', label: 'Name', name: 'name' },
    { type: 'string', label: 'Tagline', name: 'tagline' },
    { type: 'rich-text', label: 'Intro', name: 'intro' },
    {
      type: 'object',
      label: 'Background image',
      name: 'image',
      fields: [
        { name: 'src', label: 'Image', type: 'image' },
        { name: 'alt', label: 'Alt text', type: 'string' },
      ],
    },
    {
      type: 'object',
      label: 'Links',
      name: 'actions',
      list: true,
      ui: {
        itemProps: (item) => ({ label: item?.label }),
        defaultItem: { label: 'Read the blog', link: '/posts' },
      },
      fields: [
        { type: 'string', label: 'Label', name: 'label' },
        { type: 'string', label: 'Link', name: 'link' },
      ],
    },
  ],
};
