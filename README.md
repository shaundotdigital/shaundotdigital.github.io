# shaundotdigital.github.io

Personal site and portfolio for Shaun, built with [Astro](https://astro.build) and Tailwind CSS, hosted on GitHub Pages at [byshaun.xyz](https://byshaun.xyz).

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start the dev server at `localhost:4321`    |
| `npm run build`   | Build the site to `./dist/`                 |
| `npm run preview` | Preview the build locally                   |
| `npm run check`   | Type-check the project with `astro check`   |

## Branches

- `dev` - day-to-day work
- `live` - production. Pushing here triggers the deploy workflow
- `boilerplate` - reusable starting point

## Structure

```text
public/          Static files copied as-is (CNAME, favicon, humans.txt)
src/components/  Page sections
src/layouts/     Layout.astro - shared <head>, meta tags and global CSS
src/pages/       Routes
src/styles/      global.css - Tailwind import and theme colours
```

`dist/` and `.astro/` are generated and not committed.
