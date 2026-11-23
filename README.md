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
  assets/           Images Astro resizes at build time (the hero photo, project pictures). Pages CMS uploads land here
  components/       Site-wide parts: nav, contact, footer, analytics, logo, icons, light/dark switch
  components/home/  Homepage sections: Hero, Domains (Approach), Experience, Films
  components/project/  Parts of a project page: hero, results band, charts, tweet cards, lessons, previous and next
  data/             The site's words, one file per section. Edited in Pages CMS
  data/projects/    One JSON file per project case study
  layouts/          Layout.astro: the shared page shell, <head>, meta tags and share image
  lib/              letterboxd.ts (films data), projects.ts (list, order and hide drafts), projectImages.ts, projectDate.ts
  pages/            index.astro (homepage), privacy.astro, projects/index.astro (the list) and projects/[slug].astro (one case study)
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
| `projects/*.json` | One file per project case study. See [Projects](#projects) |
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

### Testing CMS changes on dev

Pages CMS reads `.pages.yml` from whichever branch is open, so new fields or sections can be tried on `dev` before they go live:

1. Change `.pages.yml` (and the code that uses it) on `dev` and push.
2. In Pages CMS, click the repo name at the top of the sidebar and switch from `cms` to `dev`.
3. Try it out. Saves here are commits to `dev` only, so nothing goes live.
4. Pull `dev` and run `npm run dev` to see the result.
5. Merge `dev` into `live` and push. The code and any content saved on `dev` go live, and are copied to `cms`.
6. Switch Pages CMS back to `cms` for everyday editing.

Content saved on `dev` while testing goes live with the next release, so use real wording or undo it first.

### Projects

Each case study is one file in `src/data/projects/`, edited in Pages CMS under Projects. The page at `/projects/<slug>` and the card on `/projects` are both built from that file.

#### Draft or published

Every project has a status. `published` shows on the live site. `draft` shows in `npm run dev` with a Draft tag and is left out of the live build entirely: no page, no card and no link. The Projects link in the menu only appears when at least one project is showing, and until then `/projects` sends visitors to the homepage. An unfinished case study can sit in Pages CMS without going public. Switch it to `published` when it's ready.

#### Adding a project

1. In Pages CMS, open Projects and add an entry. Leave the status on `draft`.
2. Fill in the fields. Only the title and slug are required to start. The summary appears on the list card. The charts, findings, tweets and lessons are all optional, and a section with nothing in it is left off the page.
3. Preview it with `npm run dev` and open `/projects`.
4. Set the status to `published` and save.

#### Pictures

Each project keeps its pictures in one folder named after its date and web address:

```text
src/assets/projects/<YYYY-MM>-<web address>/
  card.jpg           Picture on the /projects list
  tweet-avatar.jpg   Profile picture on recreated tweets
```

For example, `src/assets/projects/2019-07-twitter-management/`. The date comes first so projects with similar names can't clash and the folders sort in order. In Pages CMS, pick the picture from the image field and it stores a path like `/src/assets/projects/2019-07-twitter-management/card.jpg`. If a path points at a file that isn't there, the build stops and names the project.

#### Date and order

The date sorts projects and names the picture folder. It only shows on the site when "Show date on the site" is ticked. Projects sort by order number (lowest first), then newest date, then title. The previous and next links at the bottom of each project follow the same order.

#### Layout

Section order and the light and dark bands are set in `src/pages/projects/[slug].astro`. The look of each part is in `src/components/project/`. Colours and spacing use the same tokens as the rest of the site, in `src/styles/global.css`.

#### Old data in the dev server

After you change the fields in a project file, the dev server can keep showing the old data. Restart it with `npm run dev -- --force`.

#### Placeholder project

`example-project.json` is a draft that shows the fields. Delete it once there are real case studies.

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

Project pages use the same layout, so they're tracked the same way. Each band on a project page has an `id` (for example `trend`, `findings`, `tweets`), and that id is what shows up as the section in `ui_click`, `section_view` and `page_exit`. Give any new section an `id` or it's reported as `other`.

The privacy page explains this to visitors. If you change what's tracked, update `src/data/privacy.md` too.

## Contributing

Small fixes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem, see [SECURITY.md](SECURITY.md).

## Licence

The code is under the [MIT licence](LICENSE), so you're free to reuse it.

The site's writing, my photo, the logo and the social share image are not covered by the MIT licence. They're © Shaun Skeen, all rights reserved. Film data and posters come from Letterboxd and belong to their owners.
