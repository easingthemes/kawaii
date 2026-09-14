import type { Template } from 'tinacms';
import { TinaMarkdown } from 'tinacms/dist/rich-text';
import { tinaField } from 'tinacms/dist/react';
import type { PageBlocksContent } from '@/tina/__generated__/types';

export const Content = ({ data }: { data: PageBlocksContent }) => {
  if (!data.body) return null;
  return (
    <section className='px-6 py-12'>
      <div className='prose mx-auto max-w-2xl dark:prose-invert' data-tina-field={tinaField(data, 'body')}>
        <TinaMarkdown content={data.body} />
      </div>
    </section>
  );
};

export const contentBlockSchema: Template = {
  name: 'content',
  label: 'Text',
  ui: {
    previewSrc: '/blocks/content.png',
    defaultItem: {
      body: 'Write something here.',
    },
  },
  fields: [
    {
      type: 'rich-text',
      label: 'Body',
      name: 'body',
    },
  ],
};
