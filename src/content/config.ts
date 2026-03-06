import { defineCollection, z } from 'astro:content';

const logosCollection = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.date(),
		author: z.string().default('Anthony James Padavano'),
		featured: z.boolean().default(false),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	logos: logosCollection,
};
