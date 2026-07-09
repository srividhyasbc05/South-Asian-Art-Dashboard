const ARTIC_BASE       = "https://api.artic.edu/api/v1";
const ARTIC_IMAGE_BASE = "https://www.artic.edu/iiif/2";
 
// Fields we want back from the detail endpoint
const DETAIL_FIELDS =
  "id,title,artist_display,date_display,medium_display,place_of_origin,style_title,image_id";
 
// ── buildImageUrl ──────────────────────────────────────────────────────────────
// Builds the IIIF image URL. IIIF is a standard image-serving protocol
// that lets you request different sizes of the same image just by changing
// the URL. The format is:
//   {base}/{image_id}/full/{width},/0/default.jpg
// where {width}, means "scale to this width, calculate height automatically"
function buildImageUrl(imageId, size = "843,") {
  if (!imageId) return null;
  return `${ARTIC_IMAGE_BASE}/${imageId}/full/${size}/0/default.jpg`;
}
 
// ── probeImage ────────────────────────────────────────────────────────────────
// Does the image actually load? Fetches a tiny 200px version to check.
// Returns true if accessible, false if 403/404/network error.
// We check the small version because it's faster — same access rules apply.
async function probeImage(imageId) {
  try {
    const res = await fetch(buildImageUrl(imageId, "200,"));
    return res.ok; // true = 200 status, false = anything else (403, 404, etc.)
  } catch {
    return false;  // network failure = also not accessible
  }
}
 
// ── normalizeARTIC ────────────────────────────────────────────────────────────
// Takes ARTIC's raw JSON object and converts it into our standard shape.
// Every museum returns different field names; this function is the translator.
// After this runs, the rest of the app never needs to know where the data
// came from — it always looks the same.
function normalizeARTIC(raw) {
  return {
    title:    raw.title           || "Untitled",
    artist:   raw.artist_display  || "Unknown Artist",
    date:     raw.date_display    || "Unknown Date",
    medium:   raw.medium_display  || "Unknown Medium",
    // Prefer place_of_origin ("India, Rajasthan"), fall back to style_title ("Mughal")
    culture:  raw.place_of_origin || raw.style_title || "Unknown Origin",
    museum:   "Art Institute of Chicago",
    imageUrl: buildImageUrl(raw.image_id),
    sourceUrl: `https://www.artic.edu/artworks/${raw.id}`,
  };
}
 
// ── fetchFromARTIC ────────────────────────────────────────────────────────────
export async function fetchFromARTIC() {
  const MAX_CANDIDATES = 6; // how many candidates to try before giving up
 
  // Generate a random number used as the "seed" for Elasticsearch's
  // random_score function. A different seed = a different shuffled order.
  // This is how we get different results on each Discover click.
  const randomSeed = Math.floor(Math.random() * 1_000_000);
 
  // This is the POST body — the structured query we send to ARTIC.
  // Think of it like a database query with specific filters.
  const queryBody = {
    query: {
      function_score: {
        // The actual filter — what records to match
        query: {
          bool: {
            // MUST: these conditions are required — every result must pass ALL of these
            must: [
              { term: { is_public_domain: true } },  // only public domain
              { exists: { field: "image_id" } },      // must have an image ID
            ],
            // SHOULD: at least one of these must match (like an OR condition)
            // This is how we search multiple specific fields cleanly
            should: [
              { match: { place_of_origin: "India"      } },
              { match: { place_of_origin: "Pakistan"   } },
              { match: { place_of_origin: "Nepal"      } },
              { match: { style_title:     "Mughal"     } },
              { match: { style_title:     "Rajput"     } },
              { match: { style_title:     "Deccan"     } },
              { match: { style_title:     "Pahari"     } },
              { match: { style_title:     "Company"    } }, // Company school paintings
            ],
            minimum_should_match: 1, // at least one "should" clause must match
          },
        },
        // random_score: shuffle the results randomly using our seed.
        // "field: id" means use each artwork's ID as the base for randomization.
        functions: [{ random_score: { seed: randomSeed, field: "id" } }],
        score_mode: "sum",
        boost_mode: "replace",
      },
    },
    // Only return these lightweight fields for the search step —
    // we'll fetch full details separately only for candidates we actually use
    fields: ["id", "title", "image_id", "place_of_origin", "style_title"],
    _source: false,
    size: 20, // get 20 candidates to pick from
  };
 
  const searchRes = await fetch(`${ARTIC_BASE}/artworks/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // AIC asks apps to identify themselves in the User-Agent header
      "AIC-User-Agent": "student-art-project (contact: student@email.com)",
    },
    body: JSON.stringify(queryBody),
  });
 
  if (!searchRes.ok) {
    throw new Error(`ARTIC search failed with status ${searchRes.status}`);
  }
 
  const searchData = await searchRes.json();
  // The POST search endpoint returns results in searchData.data (same as GET)
  const candidates = (searchData.data || []).filter(c => c.image_id);
 
  if (candidates.length === 0) {
    throw new Error("ARTIC: search returned no candidates with images");
  }
 
  // Shuffle candidates array so we try them in a random order
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
 
  // Try each candidate until we find one with an accessible image
  for (let i = 0; i < Math.min(MAX_CANDIDATES, shuffled.length); i++) {
    const candidate = shuffled[i];
 
    // Step 1: Check if the image actually loads (catches 403 errors)
    const imageWorks = await probeImage(candidate.image_id);
    if (!imageWorks) {
      console.log(`ARTIC: image 403/404 for id ${candidate.id}, skipping`);
      continue; // try next candidate
    }
 
    // Step 2: Fetch the full detail record (we need all the metadata fields)
    const detailRes = await fetch(
      `${ARTIC_BASE}/artworks/${candidate.id}?fields=${DETAIL_FIELDS}`
    );
    if (!detailRes.ok) continue;
 
    const { data: artwork } = await detailRes.json();
    return normalizeARTIC(artwork);
  }
 
  throw new Error("ARTIC: all candidates had inaccessible images — try again");
}
 