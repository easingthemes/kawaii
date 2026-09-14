import type { Collection } from 'tinacms';
import { contentBlockSchema } from '@/components/blocks/content';
import { videoBlockSchema } from '@/components/blocks/video';
import { ctaBlockSchema } from '@/components/blocks/call-to-action';
import { kwHeroBlockSchema } from '@/components/blocks/kw-hero';
import { kwProseBlockSchema } from '@/components/blocks/kw-prose';
import { kwTimelineBlockSchema } from '@/components/blocks/kw-timeline';
import { kwGalleryBlockSchema } from '@/components/blocks/kw-gallery';
import { kwEventsBlockSchema } from '@/components/blocks/kw-events';
import { seoSchemaField } from '@/tina/fields/seo';

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
      description: 'Used for the tab title and sharing when no SEO title is set.',
      // Tina requires `required` alongside `isTitle`; without it the schema fails
      // validation and `tinacms build` stops before Next ever runs.
      isTitle: true,
      required: true,
    },
    seoSchemaField,
    {
      type: 'object',
      list: true,
      name: 'blocks',
      label: 'Sections',
      ui: {
        visualSelector: true,
      },
      // Deliberately short. Every extra block is one more thing to scroll past in
      // the "add section" picker, and this site is edited from a phone.
      templates: [
        kwHeroBlockSchema,
        kwProseBlockSchema,
        kwGalleryBlockSchema,
        kwEventsBlockSchema,
        kwTimelineBlockSchema,
        ctaBlockSchema,
        contentBlockSchema,
        videoBlockSchema,
      ],
    },
  ],
};

export default Page;
