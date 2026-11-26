// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: 'https://byshaun.xyz',
  // Links marked data-astro-prefetch are fetched early, so the next page opens faster.
  prefetch: true,
});