import { getCollection } from "astro:content";

// Every page that lists or shows projects gets them from here, so drafts are
// hidden in one place. On the dev server (npm run dev) drafts are included so
// you can preview them. In the live build only published projects come back.
// They come back in order: the lowest "order" number first, then by title.
export async function getProjects() {
	const projects = await getCollection("projects", ({ data }) =>
		import.meta.env.PROD ? data.status === "published" : true,
	);
	return projects.sort(
		(a, b) =>
			(a.data.order ?? Number.MAX_SAFE_INTEGER) - (b.data.order ?? Number.MAX_SAFE_INTEGER) ||
			a.data.title.localeCompare(b.data.title),
	);
}
