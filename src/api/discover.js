// ─── discover.js ──────────────────────────────────────────────────────────────
// The orchestrator. This file ties together all three museum fetchers.
// It doesn't know or care about React — it's pure logic.
//
// Having this as a separate file means:
// - If you add a 4th museum, you only edit this file and the new museum file
// - App.jsx stays clean and focused on React concerns
// - You can test this logic independently of the UI
// ─────────────────────────────────────────────────────────────────────────────

import { fetchFromARTIC }   from "./artic.js";
import { fetchFromMET }     from "./met.js";
// Harvard is not currently wired in — see harvard.js for when you're ready
// to add it back. To re-enable: uncomment this import AND add an entry to
// the MUSEUMS array further down in this file.
// import { fetchFromHarvard } from "./harvard.js";

// ─── violatesBanList ──────────────────────────────────────────────────────────
// Returns true if any of the artwork's bannable attribute VALUES
// appear in the banList array.
//
// "bannable attributes" = the fields the user can click to ban.
// We check all five at once using .some() — if even one matches, it's banned.
//
// Example:
//   artwork = { artist: "Raja Ravi Varma", date: "1890", ... }
//   banList = ["Raja Ravi Varma"]
//   → bannableValues = ["Raja Ravi Varma", "1890", ...]
//   → .some() finds "Raja Ravi Varma" in banList → returns true → banned
// ─────────────────────────────────────────────────────────────────────────────
export function violatesBanList(artwork, banList) {
  if (banList.length === 0) return false; // short-circuit: nothing banned

  const bannableValues = [
    artwork.artist,
    artwork.date,
    artwork.medium,
    artwork.culture,
    artwork.museum,
  ];

  // .some() stops checking as soon as it finds one match (efficient)
  return bannableValues.some(value => banList.includes(value));
}

// NOTE ON IMAGE VALIDATION:
// We previously added a pre-flight imageLoads() check here using a manual
// Image() object to catch CORP-blocked images before display. That's been
// REMOVED. ARTIC's own documentation confirms their images are served with
// Access-Control-Allow-Origin: * specifically so external apps can hotlink
// them — meaning ARTIC was very likely never the source of that CORP error
// in the first place. The check was adding a third network round-trip to
// every single attempt for no real benefit, which is why discoverArtwork
// was burning through MAX_ATTEMPTS so much faster and failing constantly.
// If a genuine broken-image case slips through, ArtworkDisplay.jsx's
// onError handler (which shows placeholder text) is the safety net for that.

// ─── pickMuseum (named version) ────────────────────────────────────────────────
// We need to know WHICH museum we picked (not just call it blindly), so we
// can track failures per-museum and temporarily stop trying one that's
// clearly unreachable right now (e.g. a CORS/network failure, which means
// EVERY call to that museum will fail the same way until something changes
// on their end or yours — no point burning more attempts on it).
// ─────────────────────────────────────────────────────────────────────────────
const MUSEUMS = [
  { name: "ARTIC", fetcher: fetchFromARTIC },
  { name: "MET",   fetcher: fetchFromMET },
];

function pickMuseumEntry(excludedNames) {
  const available = MUSEUMS.filter(m => !excludedNames.has(m.name));
  // If every museum has been excluded (all failing), reset and try anyone
  // again rather than getting stuck with nothing to pick from.
  const pool = available.length > 0 ? available : MUSEUMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── discoverArtwork ──────────────────────────────────────────────────────────
// The main exported function. Called when user clicks Discover.
// Keeps trying until it finds a valid artwork that passes the ban list,
// or gives up after MAX_ATTEMPTS.
//
// Why async/await?
// Fetching from an API takes time — the browser can't freeze while waiting.
// async/await lets JavaScript continue doing other things while the network
// request is in flight, then come back when the response arrives.
//
// CIRCUIT BREAKER LOGIC (new):
// If a museum fails with what looks like a network-level error (CORS block,
// "Failed to fetch", offline) rather than a normal "no matching candidate
// on this page" error, we add that museum's name to a local exclusion set
// for the REST OF THIS discoverArtwork call. This stops us from wasting
// attempts repeatedly hitting a museum whose API is currently unreachable —
// every one of those calls would fail identically anyway. We still try it
// again on your NEXT click of Discover, in case it was temporary.
// ─────────────────────────────────────────────────────────────────────────────
export async function discoverArtwork(banList) {
  const MAX_ATTEMPTS = 15;
  let lastError = null;
  const excludedMuseums = new Set(); // museums that look unreachable this call

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { name, fetcher } = pickMuseumEntry(excludedMuseums);

    try {
      const artwork = await fetcher(); // call it — this does the actual fetch

      // Guard: check image exists at all (MET's hasImages filter is buggy)
      if (!artwork.imageUrl) continue; // skip this attempt, try again

      // Guard: check against ban list
      if (violatesBanList(artwork, banList)) continue; // try again

      return artwork; // success! return this artwork to App.jsx

    } catch (err) {
      // Network-level failures (CORS blocks, offline, DNS issues) all surface
      // in the browser as the generic message "Failed to fetch" — there's no
      // more specific error the Fetch API gives us to distinguish WHY it
      // failed. If we see this, the museum's API is unreachable right now,
      // and EVERY future call to it in this loop would fail the same way.
      // So we exclude it from being picked again for the rest of this call.
      const looksUnreachable = err.message === "Failed to fetch";
      if (looksUnreachable) {
        excludedMuseums.add(name);
        console.warn(`${name} appears unreachable (CORS/network) — skipping it for the rest of this search.`);
      } else {
        // A normal "no matching candidate" type error — not a network
        // problem, just bad luck on this particular page/search. Fine to
        // try this museum again on a later attempt.
        console.warn(`Attempt ${attempt + 1} (${name}) failed:`, err.message);
      }
      lastError = err;
    }
  }

  // We exhausted all attempts. Throw so App.jsx can show an error message.
  throw new Error(
    `Could not find artwork after ${MAX_ATTEMPTS} attempts. ` +
    `Try removing some ban list items. Last error: ${lastError?.message}`
  );
}