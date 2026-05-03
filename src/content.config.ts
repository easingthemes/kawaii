import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    status: z.enum(['review', 'published']).default('published'),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    author: z.string().optional(),
    summary: z.string().optional(),
    cover: z.string().optional(),
    location: z.string().optional(),
    eventDate: z.coerce.date().optional(),
    docId: z.string(),
    docUrl: z.string().url().optional(),
  }),
});

export const collections = { articles };
