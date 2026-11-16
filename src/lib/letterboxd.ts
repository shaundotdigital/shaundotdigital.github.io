// Film data for the homepage.
//
// - Recently watched is pulled from the public Letterboxd RSS feed when the
//   site builds. If that request fails, the last good copy in
//   data/letterboxd-recent.json is used. The dev server rewrites that file
//   whenever the feed changes, so commit it when it shows up in git.
// - The four favourites and the film count live in
//   src/data/letterboxd-profile.json and are edited by hand. Letterboxd has no
//   public API and blocks scripts from reading profile pages (403), so these
//   cannot be fetched automatically.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import profile from "../data/letterboxd-profile.json";

export const USERNAME = "shaundotdigital";

const PROFILE_URL = `https://letterboxd.com/${USERNAME}/`;
const SNAPSHOT_PATH = path.join(process.cwd(), "data", "letterboxd-recent.json");
const RECENT_COUNT = 10;
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

export interface LetterboxdData {
  profileUrl: string;
  filmsLogged: string | null;
  favourites: Favourite[];
  recent: Watch[];
}

/** Letterboxd poster URLs carry their size, so the same poster can be requested smaller. */
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

async function fetchRecent(): Promise<Watch[]> {
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
  for (const item of xml.split("<item>").slice(1)) {
    // Lists share the feed but have no film title, so they are skipped here.
    const title = tag(item, "letterboxd:filmTitle");
    const watched = tag(item, "letterboxd:watchedDate");
    const link = tag(item, "link");
    if (!title || !watched || !link) continue;

    watches.push({
      title,
      year: tag(item, "letterboxd:filmYear") ?? "",
      url: link,
      poster: item.match(/<img src="([^"]+)"/)?.[1] ?? null,
      watched,
      rewatch: tag(item, "letterboxd:rewatch") === "Yes",
      liked: tag(item, "letterboxd:memberLike") === "Yes",
    });
    if (watches.length === RECENT_COUNT) break;
  }

  if (watches.length === 0) throw new Error("No films found in the RSS feed");
  return watches;
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

  try {
    const recent = await fetchRecent();
    if (import.meta.env.DEV && JSON.stringify(recent) !== JSON.stringify(snapshot)) {
      await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
      await writeFile(SNAPSHOT_PATH, JSON.stringify(recent, null, 2) + "\n");
    }
    return recent;
  } catch (error) {
    console.warn(`[letterboxd] Using the saved copy of recently watched: ${(error as Error).message}`);
    return snapshot;
  }
}

let cached: Promise<LetterboxdData> | undefined;

/** One feed request per build, or per dev server session. */
export function getLetterboxd(): Promise<LetterboxdData> {
  return (cached ??= loadRecent().then((recent) => ({
    profileUrl: PROFILE_URL,
    filmsLogged: profile.filmsLogged ?? null,
    favourites: profile.favourites,
    recent,
  })));
}
