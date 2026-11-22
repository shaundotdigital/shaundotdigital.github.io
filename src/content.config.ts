import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Case studies. One JSON file per project in src/data/projects, edited in Pages CMS.
const projects = defineCollection({
	loader: glob({ pattern: "*.json", base: "./src/data/projects" }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		// Drafts show on the dev server only. They're left out of the live build.
		status: z.enum(["draft", "published"]).default("draft"),
		summary: z.string().optional(),
	}),
});

export const collections = { projects };
