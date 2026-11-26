// Film data for the homepage. Everything is fetched from Letterboxd when the site builds.
//
// - Recently watched comes from the public RSS feed.
// - The four favourites and the film count come from the profile page, with each
//   favourite's poster and director read from its film page.
// - Letterboxd blocks GitHub's build servers from the profile page, so on the live build the
//   saved count is used and topped up from the feed: every diary entry logged since the count
//   was saved that isn't a rewatch is a new film. Favourites only update from the saved copy.
// - If a request fails, the last good copy in data/ is used instead:
//   data/letterboxd-recent.json and data/letterboxd-profile.json. The dev server
//   rewrites those files whenever Letterboxd changes, so commit them when they show up in git.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const USERNAME = "shaundotdigital";

const PROFILE_URL = `https://letterboxd.com/${USERNAME}/`;
const SNAPSHOT_PATH = path.join(process.cwd(), "data", "letterboxd-recent.json");
const PROFILE_SNAPSHOT_PATH = path.join(process.cwd(), "data", "letterboxd-profile.json");
const RECENT_COUNT = 12;
const TIMEOUT_MS = 8000;

export interface Film {
  title: string;
  year: string;
  url: string;
  poster: string | null;
}

export interface Favourite extends Film {
  director: string | null;
}

export interface Watch extends Film {
  /** ISO date, e.g. 2026-11-14 */
  watched: string;
  rewatch: boolean;
  liked: boolean;
}

interface Profile {
  filmsLogged: string | null;
  favourites: Favourite[];
  /** When the count was read: the newest feed entry at that moment (ISO date and time) */
  countedUpTo?: string | null;
}

/** One diary entry in the feed, used to top up the film count */
interface FeedEntry {
  logged: string;
  rewatch: boolean;
}

interface Feed {
  recent: Watch[];
  entries: FeedEntry[];
}

export interface LetterboxdData {
  profileUrl: string;
  filmsLogged: string | null;
  favourites: Favourite[];
  recent: Watch[];
}

/**
 * Letterboxd poster URLs carry their size, so the same poster can be requested smaller.
 * Only some widths exist. These work for every poster tested: 70, 140, 150, 230, 300, 600.
 * Any other width can return an error, so pick from that list.
 */
export function posterAt(url: string, width: number): string {
  return url.replace(/-0-\d+-0-\d+-crop/, `-0-${width}-0-${Math.round(width * 1.5)}-crop`);
}

function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function tag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1].trim()) : null;
}

async function fetchFeed(): Promise<Feed> {
  const url = `${PROFILE_URL}rss/`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml,application/xml",
      "User-Agent": "Mozilla/5.0 (compatible; byshaun.xyz site build)",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const xml = await response.text();

  const watches: Watch[] = [];
  const entries: FeedEntry[] = [];
  for (const item of xml.split("<item>").slice(1)) {
    // Lists share the feed but have no film title, so they are skipped here.
    const title = tag(item, "letterboxd:filmTitle");
    const watched = tag(item, "letterboxd:watchedDate");
    const link = tag(item, "link");
    // The link goes straight into the page, so only Letterboxd's own addresses are accepted.
    if (!title || !watched || !link?.startsWith("https://letterboxd.com/")) continue;

    const rewatch = tag(item, "letterboxd:rewatch") === "Yes";
    const published = new Date(tag(item, "pubDate") ?? "");
    if (!Number.isNaN(published.getTime())) entries.push({ logged: published.toISOString(), rewatch });

    if (watches.length < RECENT_COUNT) {
      watches.push({
        title,
        year: tag(item, "letterboxd:filmYear") ?? "",
        url: link,
        poster: item.match(/<img src="([^"]+)"/)?.[1] ?? null,
        watched,
        rewatch,
        liked: tag(item, "letterboxd:memberLike") === "Yes",
      });
    }
  }

  if (watches.length === 0) throw new Error("No films found in the RSS feed");
  return { recent: watches, entries };
}

let feedRequest: Promise<Feed | null> | undefined;

/** The feed is used twice (recently watched and the film count), so fetch it once. */
function getFeed(): Promise<Feed | null> {
  return (feedRequest ??= fetchFeed().catch((error) => {
    console.warn(`[letterboxd] Could not read the RSS feed: ${(error as Error).message}`);
    return null;
  }));
}

async function readSnapshot(): Promise<Watch[]> {
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, "utf-8"));
  } catch {
    return [];
  }
}

async function loadRecent(): Promise<Watch[]> {
  const snapshot = await readSnapshot();

  const feed = await getFeed();
  if (!feed) {
    console.warn("[letterboxd] Using the saved copy of recently watched");
    return snapshot;
  }
  if (import.meta.env.DEV && JSON.stringify(feed.recent) !== JSON.stringify(snapshot)) {
    await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
    await writeFile(SNAPSHOT_PATH, JSON.stringify(feed.recent, null, 2) + "\n");
  }
  return feed.recent;
}

// Profile and film pages are normal web pages, so ask for them the way a browser would.
const PAGE_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-GB,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
};

async function getPage(url: string): Promise<string> {
  const response = await fetch(url, { headers: PAGE_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

/** Poster and director for one film, from the structured data on its Letterboxd page. */
async function fetchFilmDetails(slug: string): Promise<{ poster: string | null; director: string | null }> {
  const html = await getPage(`https://letterboxd.com/film/${slug}/`);
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  if (!raw) throw new Error(`No film details found for ${slug}`);
  // Letterboxd wraps the JSON in /* <![CDATA[ */ comments.
  const data = JSON.parse(raw.replace(/\/\*[\s\S]*?\*\//g, "").trim());
  const directors: { name: string }[] = Array.isArray(data.director) ? data.director : data.director ? [data.director] : [];
  return {
    poster: typeof data.image === "string" ? data.image : null,
    director: directors.map((d) => d.name).join(", ") || null,
  };
}

async function fetchProfile(): Promise<Profile> {
  const html = await getPage(PROFILE_URL);

  const filmsLogged = html.match(/<span class="value">([\d,]+)<\/span><span class="definition[^"]*">Films<\/span>/)?.[1] ?? null;

  const start = html.indexOf('id="favourites"');
  if (start === -1) throw new Error("No favourites section on the profile page");
  const section = html.slice(start, html.indexOf("</section>", start));

  const picks: { slug: string; name: string }[] = [];
  for (const match of section.matchAll(/data-item-name="([^"]+)"[^>]*?data-item-slug="([^"]+)"/g)) {
    const [, name, slug] = match;
    if (!picks.some((pick) => pick.slug === slug)) picks.push({ slug, name: decode(name) });
  }
  if (picks.length === 0) throw new Error("No favourite films found on the profile page");

  const favourites = await Promise.all(
    picks.slice(0, 4).map(async ({ slug, name }) => {
      // The profile gives the name as "Title (2024)".
      const named = name.match(/^(.*) \((\d{4})\)$/);
      const details = await fetchFilmDetails(slug);
      return {
        title: named ? named[1] : name,
        year: named ? named[2] : "",
        director: details.director,
        url: `https://letterboxd.com/film/${slug}/`,
        poster: details.poster,
      };
    })
  );

  return { filmsLogged, favourites };
}

/** Newest entry in the feed, so a saved count knows which entries it already includes. */
function newestEntry(feed: Feed | null): string | null {
  if (!feed || feed.entries.length === 0) return null;
  return feed.entries.map((entry) => entry.logged).sort().at(-1)!;
}

/** Adds every first-time watch logged since the saved count was read. */
function topUpCount(saved: Profile, feed: Feed | null): string | null {
  const base = Number((saved.filmsLogged ?? "").replace(/,/g, ""));
  if (!saved.filmsLogged || !Number.isFinite(base) || !saved.countedUpTo || !feed) return saved.filmsLogged;

  const since = new Date(saved.countedUpTo).getTime();
  const added = feed.entries.filter((entry) => !entry.rewatch && new Date(entry.logged).getTime() > since).length;
  if (added > 0) {
    console.log(`[letterboxd] Film count worked out from the feed: ${saved.filmsLogged} + ${added} new`);
  }
  return (base + added).toLocaleString("en-GB");
}

async function loadProfile(): Promise<Profile> {
  let snapshot: Profile = { filmsLogged: null, favourites: [], countedUpTo: null };
  try {
    snapshot = JSON.parse(await readFile(PROFILE_SNAPSHOT_PATH, "utf-8"));
  } catch {}

  const feed = await getFeed();

  try {
    const profile: Profile = { ...(await fetchProfile()), countedUpTo: newestEntry(feed) ?? snapshot.countedUpTo ?? null };
    if (import.meta.env.DEV && JSON.stringify(profile) !== JSON.stringify(snapshot)) {
      await mkdir(path.dirname(PROFILE_SNAPSHOT_PATH), { recursive: true });
      await writeFile(PROFILE_SNAPSHOT_PATH, JSON.stringify(profile, null, 2) + "\n");
    }
    return profile;
  } catch (error) {
    console.warn(`[letterboxd] Using the saved copy of favourites and film count: ${(error as Error).message}`);
    return { ...snapshot, filmsLogged: topUpCount(snapshot, feed) };
  }
}

let cached: Promise<LetterboxdData> | undefined;

/** Fetched once per build, or once per dev server session. */
export function getLetterboxd(): Promise<LetterboxdData> {
  return (cached ??= Promise.all([loadRecent(), loadProfile()]).then(([recent, profile]) => ({
    profileUrl: PROFILE_URL,
    filmsLogged: profile.filmsLogged,
    favourites: profile.favourites,
    recent,
  })));
}
