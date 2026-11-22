import { getCollection } from "astro:content";

// Every page that lists or shows projects gets them from here, so drafts are
// hidden in one place. On the dev server (npm run dev) drafts are included so
// you can preview them. In the live build only published projects come back.
export async function getProjects() {
	return getCollection("projects", ({ data }) =>
		import.meta.env.PROD ? data.status === "published" : true,
	);
}
