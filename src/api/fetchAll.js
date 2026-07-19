// ── fetchAll.js ───────────────────────────────────────────────────────────────
// Batch fetch for the dashboard — returns ~100 normalized ARTIC artworks.
// IDs are prefixed with "artic-" so DetailPage knows which museum to call.
// ─────────────────────────────────────────────────────────────────────────────

const ARTIC_BASE      = 'https://api.artic.edu/api/v1'
const ARTIC_IMG_BASE  = 'https://www.artic.edu/iiif/2'
const FIELDS          = 'id,title,artist_display,date_display,medium_display,place_of_origin,style_title,image_id'

function buildImageUrl(imageId) {
  if (!imageId) return null
  return `${ARTIC_IMG_BASE}/${imageId}/full/400,/0/default.jpg`
}

function normalizeARTIC(raw) {
  return {
    id:       `artic-${raw.id}`,
    rawId:    raw.id,
    title:    raw.title            || 'Untitled',
    artist:   raw.artist_display   || 'Unknown Artist',
    date:     raw.date_display     || 'Unknown Date',
    medium:   raw.medium_display   || 'Unknown Medium',
    culture:  raw.place_of_origin  || raw.style_title || 'Unknown Origin',
    museum:   'Art Institute of Chicago',
    imageUrl: buildImageUrl(raw.image_id),
    sourceUrl: `https://www.artic.edu/artworks/${raw.id}`,
  }
}

export async function fetchAllArtworks() {
  const queryBody = {
    query: {
      function_score: {
        query: {
          bool: {
            must: [
              { term: { is_public_domain: true } },
              { exists: { field: 'image_id' } },
            ],
            should: [
              { match: { place_of_origin: 'India'    } },
              { match: { place_of_origin: 'Pakistan' } },
              { match: { place_of_origin: 'Nepal'    } },
              { match: { style_title: 'Mughal'       } },
              { match: { style_title: 'Rajput'       } },
              { match: { style_title: 'Deccan'       } },
              { match: { style_title: 'Pahari'       } },
              { match: { style_title: 'Company'      } },
            ],
            minimum_should_match: 1,
          },
        },
        // FIX 1: random_score: {} causes a 400 — ARTIC requires a "field" key.
        // Without it, Elasticsearch doesn't know how to seed the randomization.
        functions: [{ random_score: { field: 'id' } }],
        score_mode: 'sum',
        boost_mode: 'replace',
      },
    },
    // FIX 2: _source is a vanilla Elasticsearch key that ARTIC doesn't support.
    // ARTIC has its own "fields" parameter for selecting which fields to return.
    // Sending _source causes an immediate 400 — ARTIC rejects it before the
    // query even runs.
    fields: FIELDS.split(','),
    size: 100,
  }

  const res = await fetch(`${ARTIC_BASE}/artworks/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'AIC-User-Agent': 'student-art-project (contact: student@email.com)',
    },
    body: JSON.stringify(queryBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`ARTIC batch fetch failed: ${res.status} — ${errText}`)
  }

  const data = await res.json()
  return (data.data || [])
    .filter(item => item.image_id)
    .map(normalizeARTIC)
}

export function computeStats(artworks) {
  if (artworks.length === 0) {
    return { total: 0, topCulture: 'N/A', topMedium: 'N/A' }
  }

  function findMode(arr) {
    const counts = {}
    arr.forEach(v => { counts[v] = (counts[v] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
  }

  return {
    total:      artworks.length,
    topCulture: findMode(artworks.map(a => a.culture)),
    topMedium:  findMode(artworks.map(a => a.medium)),
  }
}