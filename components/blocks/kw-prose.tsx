'use client';
import React from 'react';
import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { PageBlocksKwProse } from '../../tina/__generated__/types';

/**
 * A text section: small label in the left column, heading and prose on the right.
 * The workhorse block — most written content on the site is one of these.
 */
export const KwProse = ({ data }: { data: PageBlocksKwProse }) => {
  return (
    <section className='border-b kw-rule'>
      <div className='mx-auto grid max-w-5xl gap-y-6 px-6 py-20 sm:py-28 md:grid-cols-[13rem_1fr] md:gap-x-12'>
        <div className='md:pt-3'>
          {data.label && (
            <p className='kw-mono' data-tina-field={tinaField(data, 'label')}>
              {data.label}
            </p>
          )}
        </div>

        <div>
          {data.heading && (
            <h2
              className='kw-display text-[clamp(1.9rem,4vw,3rem)] text-[var(--kw-ink)]'
              data-tina-field={tinaField(data, 'heading')}
            >
              {data.heading}
            </h2>
          )}

          {data.subheading && (
            <p className='mt-3 text-lg text-[var(--kw-ink-soft)]' data-tina-field={tinaField(data, 'subheading')}>
              {data.subheading}
            </p>
          )}

          {data.body && (
            <div
              className={`kw-prose ${data.heading || data.subheading ? 'mt-8' : ''}`}
              data-tina-field={tinaField(data, 'body')}
            >
              <TinaMarkdown content={data.body} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const kwProseBlockSchema: Template = {
  name: 'kwProse',
  label: 'Text section',
  ui: {
    defaultItem: {
      label: 'About',
      heading: 'A short heading goes here.',
    },
    itemProps: (item) => ({ label: item?.heading || item?.label }),
  },
  fields: [
    { type: 'string', label: 'Label (small, monospace)', name: 'label' },
    { type: 'string', label: 'Heading', name: 'heading' },
    { type: 'string', label: 'Subheading', name: 'subheading' },
    { type: 'rich-text', label: 'Body', name: 'body' },
  ],
};
