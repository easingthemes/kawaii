import React from 'react';
import { videoBlockSchema } from '@/components/blocks/video';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Collection } from 'tinacms';

const Post: Collection = {
  label: 'Blog-Posts',
  name: 'post',
  path: 'content/posts',
  format: 'mdx',
  ui: {
    router: ({ document }) => {
      return `/posts/${document._sys.breadcrumbs.join('/')}`;
    },
  },
  fields: [
    {
      type: 'string',
      label: 'Titel',
      name: 'title',
      isTitle: true,
      required: true,
    },
    {
      type: 'image',
      name: 'heroImg',
      label: 'Foto',
      // @ts-ignore
      uploadDir: () => 'posts',
    },
    {
      type: 'rich-text',
      label: 'Kurz gesagt',
      name: 'excerpt',
      overrides: {
        toolbar: ['bold', 'italic', 'link'],
      },
    },
    {
      type: 'reference',
      label: 'Wer schreibt',
      name: 'author',
      collections: ['author'],
      ui: {
        //@ts-ignore
        optionComponent: (
          props: {
            name?: string;
            avatar: string;
          },
          _internalSys: { path: string }
        ) => {
          const { name, avatar } = props;
          if (!name) return _internalSys.path;

          return (
            <p className='flex min-h-8 items-center gap-4'>
              <Avatar>
                {avatar && <AvatarImage src={avatar} alt={`${name} Profile`} />}
                <AvatarFallback>
                  {name
                    .split(' ')
                    .map((part) => part[0]?.toUpperCase() || '')
                    .join('')}
                </AvatarFallback>
              </Avatar>
              {name}
            </p>
          );
        },
      },
    },
    {
      type: 'datetime',
      label: 'Datum',
      name: 'date',
      ui: {
        dateFormat: 'MMMM DD YYYY',
        timeFormat: 'hh:mm A',
      },
    },
    {
      type: 'number',
      label: 'Bewertung (1-10)',
      name: 'rating',
      description: 'Wie gut war es? 1 = gar nicht, 10 = der Hammer. Leer lassen, wenn der Post keine Bewertung hat.',
      ui: {
        validate: (value?: number) => {
          if (value === undefined || value === null) return;
          if (!Number.isInteger(value) || value < 1 || value > 10) return 'Bitte eine ganze Zahl zwischen 1 und 10.';
        },
      },
    },
    {
      type: 'string',
      label: 'Warum diese Bewertung?',
      name: 'ratingWhy',
      description: 'Ein Satz, z. B. "weil es geregnet hat".',
      ui: { component: 'textarea' },
    },
    {
      type: 'object',
      label: 'Themen',
      name: 'tags',
      list: true,
      fields: [
        {
          type: 'reference',
          label: 'Tag',
          name: 'tag',
          collections: ['tag'],
          ui: {
            optionComponent: (
              props: {
                name?: string;
              },
              _internalSys: { path: string }
            ) => props.name || _internalSys.path,
          },
        },
      ],
      ui: {
        itemProps: (item) => {
          return { label: item?.tag };
        },
      },
    },
    {
      type: 'rich-text',
      label: 'Text',
      name: '_body',
      templates: [
        {
          name: 'BlockQuote',
          label: 'Block Quote',
          fields: [
            {
              name: 'children',
              label: 'Quote',
              type: 'rich-text',
              overrides: {
                toolbar: ['bold', 'italic', 'link'],
              },
            },
            {
              name: 'authorName',
              label: 'Author',
              type: 'string',
            },
          ],
        },
        {
          name: 'DateTime',
          label: 'Date & Time',
          inline: true,
          fields: [
            {
              name: 'format',
              label: 'Format',
              type: 'string',
              options: ['utc', 'iso', 'local'],
            },
          ],
        },
        {
          name: 'NewsletterSignup',
          label: 'Newsletter Sign Up',
          fields: [
            {
              name: 'children',
              label: 'CTA',
              type: 'rich-text',
            },
            {
              name: 'placeholder',
              label: 'Placeholder',
              type: 'string',
            },
            {
              name: 'buttonText',
              label: 'Button Text',
              type: 'string',
            },
            {
              name: 'disclaimer',
              label: 'Disclaimer',
              type: 'rich-text',
              overrides: {
                toolbar: ['bold', 'italic', 'link'],
              },
            },
          ],
          ui: {
            defaultItem: {
              placeholder: 'Enter your email',
              buttonText: 'Notify Me',
            },
          },
        },
        {
          name: 'Frage',
          label: 'Frage an euch',
          fields: [
            { name: 'frage', label: 'Die Frage', type: 'string', ui: { component: 'textarea' } },
            { name: 'aufloesungAm', label: 'Auflösung am', type: 'string', description: 'z. B. "1. Dezember". Wird nur als Text angezeigt.' },
            { name: 'aufloesung', label: 'Die Antwort', type: 'string', description: 'Leer lassen, bis die Auflösung dran ist.', ui: { component: 'textarea' } },
          ],
        },
        videoBlockSchema,
      ],
      isBody: true,
    },
  ],
};

export default Post;
