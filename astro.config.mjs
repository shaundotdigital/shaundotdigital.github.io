import { defineConfig } from 'astro/config';

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://shaundotdigital.github.io',
  base: 'shaundotdigital.github.io',
  integrations: [tailwind()]
});