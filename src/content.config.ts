import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const logosCollection = defineCollection({
	loader: glob({ base: './src/content/logos', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		pubDate: z.coerce.date(),
		author: z.string().default('Anthony James Padavano'),
		featured: z.boolean().default(false),
		tags: z.array(z.string()).optional(),
	}),
});

const pathosCollection = defineCollection({
	loader: glob({ base: './src/content/pathos', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		hookLine: z.string(),
		date: z.coerce.date(),
		context: z.string(),
		voices: z.object({
			human: z.string(),
			ai: z.string(),
		}),
		artifacts: z
			.array(
				z.object({
					label: z.string(),
					url: z.string(),
					type: z.enum(['repo', 'system', 'artifact']),
				}),
			)
			.default([]),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = {
	logos: logosCollection,
	pathos: pathosCollection,
};
