import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const logosCollection = defineCollection({
	loader: glob({ base: './src/content/logos', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		author: z.string().default('Anthony James Padavano'),
		featured: z.boolean().default(false),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	logos: logosCollection,
};
