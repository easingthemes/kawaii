import type { Template } from 'tinacms';
import { tinaField } from 'tinacms/dist/react';
import type { PageBlocksHero } from '@/tina/__generated__/types';

export const Hero = ({ data }: { data: PageBlocksHero }) => {
  return (
    <section className='px-6 py-20 text-center sm:py-28'>
      {data.headline && (
        <h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-6xl' data-tina-field={tinaField(data, 'headline')}>
          {data.headline}
        </h1>
      )}
      {data.subline && (
        <p className='mx-auto mt-6 max-w-2xl text-lg text-pretty opacity-70' data-tina-field={tinaField(data, 'subline')}>
          {data.subline}
        </p>
      )}
    </section>
  );
};

export const heroBlockSchema: Template = {
  name: 'hero',
  label: 'Hero',
  ui: {
    previewSrc: '/blocks/hero.png',
    defaultItem: {
      headline: 'A headline',
      subline: 'A sentence under it.',
    },
  },
  fields: [
    {
      type: 'string',
      label: 'Headline',
      name: 'headline',
    },
    {
      type: 'string',
      label: 'Subline',
      name: 'subline',
      ui: {
        component: 'textarea',
      },
    },
  ],
};
