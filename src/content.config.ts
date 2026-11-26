import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// A figure in the results band: the number as it should read, and what it measures.
const stat = z.object({
	value: z.string(),
	label: z.string(),
});

// One bar in a chart. "after" colours it in the brand colour instead of grey.
// "paused" hatches it, for months where something got in the way (explained by the chart's pausedLabel).
// In the month chart the label must be a full month and year, like "December 2018".
const bar = z.object({
	label: z.string(),
	value: z.number(),
	after: z.boolean().default(false),
	paused: z.boolean().default(false),
	tick: z.string().optional(),
});

// A card above the period chart: one big figure for one of the two periods.
const periodCard = z.object({
	after: z.boolean().default(false),
	dates: z.string(),
	value: z.string(),
	measure: z.string(),
	text: z.string().optional(),
});

// A finding: a big figure, what it means, and optionally a small two-bar comparison.
const finding = z.object({
	figure: z.string(),
	title: z.string(),
	text: z.string().optional(),
	barsCaption: z.string().optional(),
	bars: z
		.array(z.object({ label: z.string(), value: z.number(), display: z.string().optional(), strong: z.boolean().default(false) }))
		.default([]),
});

// A recreated tweet.
const tweet = z.object({
	rank: z.number().optional(),
	text: z.string(),
	time: z.string(),
	replies: z.number().default(0),
	reposts: z.number().default(0),
	likes: z.number().default(0),
	url: z.string().optional(),
});

// A written section for work without figures: heading and intro, then short titled points
// or a paragraph or more of text.
const written = z.object({
	heading: z.string(),
	intro: z.string().optional(),
	items: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
	text: z.string().optional(),
});

// A chart section: heading and intro above, the chart below.
const chart = z.object({
	heading: z.string(),
	intro: z.string().optional(),
	title: z.string(),
	alt: z.string().optional(),
	note: z.string().optional(),
	// Legend text for hatched columns, e.g. "Social media shelved".
	pausedLabel: z.string().optional(),
	bars: z.array(bar).default([]),
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
		// Where it sits in the list and in the previous/next links. Lowest first, no number goes last.
		order: z.number().optional(),
		// When the project finished. Used for sorting (newest first after "order") and, if showDate is on, shown on the page.
		// Also the start of the project's picture folder: src/assets/projects/2019-07-<web address>.
		date: z.coerce.date().optional(),
		showDate: z.boolean().default(false),
		// The picture on the project's card on the Projects page. Chosen in Pages CMS from src/assets.
		image: z.string().optional(),
		imageAlt: z.string().optional(),

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

		// Names for the two periods being compared. They label chart legends and the change rows.
		periods: z
			.object({
				before: z.string().default("Before"),
				after: z.string().default("After"),
			})
			.default({ before: "Before", after: "After" }),

		// Charts. Each one is optional, and a section only shows when it's filled in.
		trend: chart.extend({ cards: z.array(periodCard).max(2).default([]) }).optional(),
		findings: z
			.object({
				heading: z.string(),
				intro: z.string().optional(),
				equalHeight: z.boolean().default(false),
				cards: z.array(finding).default([]),
			})
			.optional(),
		changes: z
			.object({
				heading: z.string(),
				intro: z.string().optional(),
				rows: z
					.array(
						z.object({
							title: z.string(),
							description: z.string().optional(),
							before: z.number(),
							after: z.number(),
							unit: z.string().optional(),
							scale: z.number().optional(),
						}),
					)
					.default([]),
			})
			.optional(),
		monthly: chart.optional(),

		// Written sections: where things started, what was built, and the build and launch.
		brief: written.optional(),
		built: written.optional(),
		launch: written.optional(),
		// Pictures of the work, such as page screenshots. A very tall one scrolls inside a frame.
		screenshots: z
			.object({
				heading: z.string(),
				intro: z.string().optional(),
				items: z.array(z.object({ image: z.string(), alt: z.string(), caption: z.string().optional() })).default([]),
			})
			.optional(),
		tweets: z
			.object({
				heading: z.string(),
				intro: z.string().optional(),
				author: z.string().default(""),
				handle: z.string().default(""),
				avatar: z.string().default(""),
				avatarImage: z.string().optional(),
				equalHeight: z.boolean().default(false),
				items: z.array(tweet).default([]),
			})
			.optional(),
		lessons: z
			.object({
				heading: z.string(),
				items: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
				note: z.string().optional(),
			})
			.optional(),
	}),
});

export const collections = { projects };
