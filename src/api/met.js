const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
 
// Art STYLE terms — very specific to South Asian art traditions.
// These appear in culture/period/dynasty fields almost exclusively for
// South Asian work. Much more precise than geographic terms.
const STYLE_TERMS = ["mughal", "rajput", "pahari", "deccan", "chola", "pala", "vijayanagara"];
 
// Geographic terms — broader, used as a secondary search to widen the pool.
// Less precise but catches work that uses region names instead of style names.
const GEO_TERMS = ["india", "nepal", "pakistan"];
 
// After fetching an object, we check whether it's actually South Asian
// by scanning multiple fields. This catches both style-labeled AND
// geographically-labeled South Asian work.
const SOUTH_ASIAN_KEYWORDS = [
  "india", "indian", "south asia", "south asian",
  "mughal", "rajput", "pahari", "deccan", "chola", "pala",
  "pakistan", "bangladesh", "nepal", "sri lanka",
  "kashmir", "punjab", "bengal", "gujarat", "rajasthan",
  "hindustan", "indo-persian", "sultanate",
];
 
// ── isSouthAsian ──────────────────────────────────────────────────────────────
// Checks multiple fields on the raw Met object to determine if it's
// genuinely South Asian. We check culture, department, period, dynasty,
// and even the title — because different records store the region info
// in different fields depending on how the curator catalogued it.
function isSouthAsian(obj) {
  const textToCheck = [
    obj.culture,
    obj.department,
    obj.period,
    obj.dynasty,
    obj.artistNationality,
    obj.title,
    obj.objectName,
  ]
    .filter(Boolean)           // remove nulls/undefined
    .join(" ")                 // combine into one string
    .toLowerCase();            // lowercase for case-insensitive comparison
 
  return SOUTH_ASIAN_KEYWORDS.some(keyword => textToCheck.includes(keyword));
}
 
// ── normalizeMET ──────────────────────────────────────────────────────────────
// Converts the Met's raw JSON into our standard normalized shape.
// Met's field names are different from ARTIC's — this is the translator.
function normalizeMET(raw) {
  return {
    title:    raw.title             || "Untitled",
    artist:   raw.artistDisplayName || "Unknown Artist",
    date:     raw.objectDate        || "Unknown Date",
    medium:   raw.medium            || "Unknown Medium",
    // Met uses "culture" for things like "India (Rajasthan)" — exactly what we want
    culture:  raw.culture || raw.period || "Unknown Origin",
    museum:   "The Metropolitan Museum of Art",
    imageUrl: raw.primaryImage || null,
    sourceUrl: raw.objectURL  ||
               `https://www.metmuseum.org/art/collection/search/${raw.objectID}`,
  };
}
 
// ── fetchIDPool ───────────────────────────────────────────────────────────────
// Runs two searches in parallel and returns a combined, deduplicated ID list.
//
// Promise.all([a, b]) means: start BOTH requests at the same time,
// then wait until BOTH are done, then continue. This is faster than
// doing them sequentially (start a, wait, start b, wait).
async function fetchIDPool() {
  const styleTerm = STYLE_TERMS[Math.floor(Math.random() * STYLE_TERMS.length)];
  const geoTerm   = GEO_TERMS[Math.floor(Math.random() * GEO_TERMS.length)];
 
  // Both fetches start simultaneously
  const [styleRes, geoRes] = await Promise.all([
    fetch(`${MET_BASE}/search?q=${styleTerm}&isPublicDomain=true&hasImages=true`),
    fetch(`${MET_BASE}/search?q=${geoTerm}&isPublicDomain=true&hasImages=true&departmentId=6`),
  ]);
 
  const allIDs = [];
 
  if (styleRes.ok) {
    const d = await styleRes.json();
    if (d.objectIDs) allIDs.push(...d.objectIDs); // spread array into allIDs
  }
  if (geoRes.ok) {
    const d = await geoRes.json();
    if (d.objectIDs) allIDs.push(...d.objectIDs);
  }
 
  // Set automatically removes duplicates — an ID appearing in both searches
  // only appears once. Spread back into an array so we can use array methods.
  return [...new Set(allIDs)];
}
 
// ── fetchFromMET ──────────────────────────────────────────────────────────────
export async function fetchFromMET() {
  const MAX_CANDIDATES = 12; // try up to 12 IDs before giving up
 
  const objectIDs = await fetchIDPool();
 
  if (objectIDs.length === 0) {
    throw new Error("MET: search returned no object IDs");
  }
 
  // Shuffle so we try IDs in a random order each call
  const shuffled = [...objectIDs].sort(() => Math.random() - 0.5);
 
  for (let i = 0; i < Math.min(MAX_CANDIDATES, shuffled.length); i++) {
    const id = shuffled[i];
 
    let obj;
    try {
      const res = await fetch(`${MET_BASE}/objects/${id}`);
      if (!res.ok) continue; // 404 or removed — skip, try next ID
      obj = await res.json();
    } catch {
      continue; // network error on this specific ID — skip it
    }
 
    // Validate: is this actually South Asian?
    if (!isSouthAsian(obj)) continue;
 
    // Validate: does it have an image?
    if (!obj.primaryImage) continue;
 
    return normalizeMET(obj);
  }
 
  throw new Error("MET: exhausted candidates without finding a valid South Asian artwork");
}
 