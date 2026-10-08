/**
 * Fails the build if a shipped stylesheet loads anything from another host.
 *
 * Every app that imports Roster's CSS ships whatever it asks for. A `url()`
 * pointing at another site is a request to that site from every page of every
 * app, which leaks visitors to a third party, breaks under a strict
 * Content-Security-Policy and fails offline. Nobody would write one into a
 * component on purpose. Roster shipped one anyway: a Countdown story asked for
 * a texture with an arbitrary-value class, and Tailwind, which scans stories
 * as well as components, emitted it into roster.css.
 *
 * So the artifact is checked rather than the source, as in check-prefix.mjs.
 * A `data:` URL is inline and loads nothing, and a relative one resolves
 * against the app's own host; anything with a scheme, or starting with `//`,
 * fails. So does any quoted string that's an absolute address, which is
 * stricter than CSS needs (a `content` string loads nothing) and cheaper than
 * knowing every place CSS reads a string as an address.
 */
import { readFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SHEETS = ["dist/roster.css", "dist/tokens.css", "dist/preflight.css"];

const URL_TOKEN = /url\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^)\s]*))\s*\)/gi;
const STRING = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
const absolute = (target) => !/^data:/i.test(target) && (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//"));

/**
 * Each address in `css` that reaches another host, as written: in a `url()`,
 * or a bare string where CSS takes one as an address (`@import "…"`,
 * `image-set("…" 1x)`). `url()`s are read first and taken out, so a quoted
 * address inside a `data:` URL, an SVG's namespace say, isn't mistaken for one.
 */
export function absoluteUrls(css) {
  const found = [];
  const rest = css.replace(URL_TOKEN, (_, double, single, bare) => {
    const target = (double ?? single ?? bare).trim();
    if (absolute(target)) found.push(target);
    return "url()";
  });
  for (const match of rest.matchAll(STRING)) {
    const target = (match[1] ?? match[2]).trim();
    if (absolute(target)) found.push(target);
  }
  return found;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  let failed = false;
  for (const sheet of SHEETS) {
    if (!existsSync(sheet)) {
      console.error(`[check-css-urls] ${sheet} not found. Run the build first.`);
      process.exit(1);
    }
    for (const url of absoluteUrls(readFileSync(sheet, "utf8"))) {
      console.error(`[check-css-urls] ${sheet} loads ${url} from another host`);
      failed = true;
    }
  }
  if (failed) process.exit(1);
  console.log(`[check-css-urls] no address on another host in ${SHEETS.length} stylesheets`);
}
