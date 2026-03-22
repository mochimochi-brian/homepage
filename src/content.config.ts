import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['research', 'music']),
    lang: z.enum(['ja', 'en']).default('ja'),
    thumbnail: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    venue: z.string(),
    description: z.string().optional(),
    lang: z.enum(['ja', 'en']).default('ja'),
    type: z.enum(['concert', 'lecture', 'opera']).default('concert'),
    url: z.string().url().optional(),
    past: z.boolean().default(false),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    journal: z.string(),
    year: z.number(),
    doi: z.string().optional(),
    pdf: z.string().url().optional(),
  }),
});

const performances = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/performances' }),
  schema: z.object({
    title: z.string(),
    role: z.string().optional(),
    date: z.coerce.date(),
    venue: z.string(),
    type: z.enum(['opera', 'concert', 'competition']).default('concert'),
  }),
});

export const collections = { blog, events, publications, performances };
