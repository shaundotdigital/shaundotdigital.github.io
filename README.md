# shaundotdigital.github.io

Personal site and portfolio for Shaun, live at [byshaun.xyz](https://byshaun.xyz).

## Stack

| Part | What it does |
| :--- | :--- |
| [Astro](https://astro.build) | Builds the site into plain HTML and CSS. There's no server; every page is a static file. |
| [Tailwind CSS](https://tailwindcss.com) | Styling. Theme colours, light and dark mode, and shared classes are in `src/styles/global.css`. |
| [Space Grotesk](https://fontsource.org/fonts/space-grotesk) | Display font, self-hosted through Fontsource, so no requests go to Google Fonts. |
| [GitHub Pages](https://pages.github.com) | Hosting, on the custom domain in `public/CNAME`. |
| GitHub Actions | Builds and deploys the site, and keeps Pages CMS edits in sync between branches. |
| [Pages CMS](https://pagescms.org) | Web editor for the site's words. It edits the files in `src/data` and commits them. |
| [Letterboxd](https://letterboxd.com/shaundotdigital/) | Films section: recently watched, four favourites and the film count. |
| Google Analytics 4 | Visit counts plus click, scroll, section and exit events. Off for EU visitors, opt-out in the footer. |

## Commands

| Command           | Action                                      |
| :---------------- | :------------------------------------------ |
| `npm install`     | Install dependencies                        |
| `npm run dev`     | Start the dev server at `localhost:4321`    |
| `npm run build`   | Build the site to `./dist/`                 |
| `npm run preview` | Preview the build locally                   |
| `npm run check`   | Type-check the project with `astro check`   |

If the dev server can't find a package after `npm install`, stop it and start it again.

## Structure

```text
.github/workflows/
  deploy.yml        Builds and deploys on every push to live, and twice a day for Letterboxd
  cms-sync.yml      Publishes Pages CMS edits and keeps live, dev and cms in step
.pages.yml          Pages CMS setup: which files it edits and the fields for each
data/               Last good copy of the Letterboxd data, used when Letterboxd can't be reached
public/             Copied as-is: domain (CNAME), favicons, share image, humans.txt
src/
  assets/           Images Astro resizes at build time (the hero photo). Pages CMS uploads land here
  components/       Site-wide parts: nav, contact, footer, analytics, logo, icons, light/dark switch
  components/home/  Homepage sections: Hero, Domains (Approach), Experience, Films
  data/             The site's words, one file per section. Edited in Pages CMS
  layouts/          Layout.astro: the shared page shell, <head>, meta tags and share image
  lib/              letterboxd.ts: fetches the films data
  pages/            index.astro (homepage) and privacy.astro
  styles/           global.css: Tailwind, theme colours, dark mode and shared classes
```

`dist/` and `.astro/` are generated and not committed.

## How it works

### Content

The words on the site live in `src/data`, not in the components:

| File | Section |
| :--- | :--- |
| `site.json` | Site name, search description, share image description, menu labels |
| `hero.json` | Top of the homepage and the ID card, including which photo to show |
| `approach.json` | The Approach heading, intro and cards |
| `experience.json` | Work history, newest first |
| `films.json` | Headings and labels in the films section |
| `contact.json` | Closing heading, email address and social links |
| `footer.json` | Copyright name, "Built with" links and the analytics notice |
| `privacy.md` | The privacy page |

Edit these in Pages CMS, or by hand on `dev` like any other file. If a code change adds or renames a field, update `.pages.yml` in the same change so Pages CMS shows it.

The email address never appears in the page's HTML. It's put back together by a script once the page loads, so bots scanning for addresses don't find it.

### Branches

| Branch | Used for |
| :--- | :--- |
| `dev` | Code and design work. Test here with `npm run dev`. |
| `live` | What's on byshaun.xyz. Every push deploys. |
| `cms` | Pages CMS saves here. Don't commit to it by hand. |
| `boilerplate` | A reusable starting point, not part of the site. |

### Publishing

- **Code and design:** work on `dev`, then merge `dev` into `live` and push. The site deploys in about a minute, and `cms-sync.yml` copies `live` into `cms` so Pages CMS edits the newest version.
- **Words:** save in Pages CMS. `cms-sync.yml` merges the save into `live`, deploys it, and copies it to `dev`. If it can't merge into `dev` cleanly (the same text was changed there too), the edit still goes live and the run shows a warning asking for a merge by hand.

GitHub doesn't let a workflow's own pushes start other workflows, so `cms-sync.yml` starts the deploy itself.

### Films

`src/lib/letterboxd.ts` reads the films data when the site builds:

- **Recently watched** comes from the public RSS feed.
- **The four favourites and the film count** come from the profile page. Letterboxd blocks GitHub's build servers from that page, so on live builds the saved copy in `data/letterboxd-profile.json` is used. The film count is then topped up from the feed: every diary entry logged since the count was saved that isn't a rewatch is a new film.
- When anything can't be fetched, the saved copies in `data/` are used. The dev server refreshes them from Letterboxd whenever they change, so commit them when they show up in git. That also brings the favourites and the exact film count up to date.

`deploy.yml` rebuilds the site at 11:07 and 23:07 UTC so the films stay current without a commit. It also stops GitHub switching the schedule off after 60 days without activity.

### Analytics

`src/components/Analytics.astro` loads Google Analytics on the built site only, never in dev. It doesn't load for visitors in EU, EEA or Swiss time zones, for anyone who has opted out in the footer, or for browsers sending Global Privacy Control or Do Not Track. Advertising features are off.

As well as page views, it sends:

| Event | When |
| :--- | :--- |
| `ui_click` | Any link or button: its text, type, where it goes and which section it's in |
| `scroll_depth` | At 25, 50, 75 and 100 per cent down the page |
| `section_view` | The first time each section reaches the middle of the screen |
| `page_exit` | On leaving: the last and furthest section reached, and how far down they scrolled |

The privacy page explains this to visitors. If you change what's tracked, update `src/data/privacy.md` too.

## Contributing

Small fixes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem, see [SECURITY.md](SECURITY.md).

## Licence

The code is under the [MIT licence](LICENSE), so you're free to reuse it.

The site's writing, my photo, the logo and the social share image are not covered by the MIT licence. They're © Shaun Skeen, all rights reserved. Film data and posters come from Letterboxd and belong to their owners.
