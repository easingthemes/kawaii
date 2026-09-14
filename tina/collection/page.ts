import type { Collection } from 'tinacms';
import { contentBlockSchema } from '@/components/blocks/content';
import { heroBlockSchema } from '@/components/blocks/hero';

// Block schemas live next to their component, in components/blocks/*.tsx, and
// are imported here. Adding a block means three edits: the component file, this
// templates list, and the switch in components/blocks/index.tsx.
const Page: Collection = {
  label: 'Pages',
  name: 'page',
  path: 'content/pages',
  format: 'mdx',
  ui: {
    router: ({ document }) => {
      const filepath = document._sys.breadcrumbs.join('/');
      if (filepath === 'home') {
        return '/';
      }
      return `/${filepath}`;
    },
  },
  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Page title',
      description: 'Shown in the browser tab and in search results.',
      isTitle: true,
      required: true,
    },
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Sections',
      ui: {
        visualSelector: true,
      },
      templates: [heroBlockSchema, contentBlockSchema],
    },
  ],
};

export default Page;
