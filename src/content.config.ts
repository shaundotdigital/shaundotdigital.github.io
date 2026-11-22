import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// A figure in the results band: the number as it should read, and what it measures.
const stat = z.object({
	value: z.string(),
	label: z.string(),
});

// Case studies. One JSON file per project in src/data/projects, edited in Pages CMS.
const projects = defineCollection({
	loader: glob({ pattern: "*.json", base: "./src/data/projects" }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		// Drafts show on the dev server only. They're left out of the live build.
		status: z.enum(["draft", "published"]).default("draft"),
		summary: z.string().optional(),

		// Hero. The headline is split like the homepage one: the middle part sits in the black pill.
		category: z.string().optional(),
		headlineStart: z.string().optional(),
		headlineHighlight: z.string().optional(),
		headlineEnd: z.string().optional(),
		facts: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
		tags: z.array(z.string()).default([]),

		// Results band: one big figure, then up to three smaller ones beside it.
		results: z
			.object({
				main: stat,
				others: z.array(stat).max(3).default([]),
			})
			.optional(),
	}),
});

export const collections = { projects };
