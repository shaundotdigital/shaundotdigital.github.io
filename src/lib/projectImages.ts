import type { ImageMetadata } from "astro";

// Project pictures are picked in Pages CMS from src/assets, so Astro can still resize them.
// Each project keeps its pictures in its own folder, named after its web address:
//   src/assets/projects/<web address>/card.jpg
// The stored value looks like /src/assets/projects/twitter-management/card.jpg.
const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/**/*.{jpeg,jpg,png,webp,avif}", { eager: true });

export function getProjectImage(path: string | undefined, project: string) {
	if (!path) return undefined;
	const image = images[path]?.default;
	if (!image) throw new Error(`Image not found for project "${project}": ${path}. It must be an image in src/assets.`);
	return image;
}
