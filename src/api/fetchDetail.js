// ─── fetchDetail.js ───────────────────────────────────────────────────────────
// Fetches the ENRICHED record for a single artwork when a user clicks through
// to the detail page. These fields are NOT in the batch fetch (too much data
// to load for 150 artworks at once) — we only fetch them when actually needed.
//
// Both functions return the same shape so DetailPage doesn't care which museum
// the artwork came from.
// ─────────────────────────────────────────────────────────────────────────────

const ARTIC_BASE      = 'https://api.artic.edu/api/v1';
const ARTIC_IMG_BASE  = 'https://www.artic.edu/iiif/2';

// Extra fields only fetched for the detail view
const ARTIC_DETAIL_FIELDS = [
  'id', 'title', 'artist_display', 'date_display', 'medium_display',
  'place_of_origin', 'style_title', 'image_id',
  'description',           // curator's prose description
  'dimensions',            // physical size
  'credit_line',           // how the museum acquired it
  'artwork_type_title',    // "Painting", "Print", etc.
  'provenance_text',       // ownership history
].join(',');

// ─── fetchARTICDetail ─────────────────────────────────────────────────────────
export async function fetchARTICDetail(id) {
  const res = await fetch(`${ARTIC_BASE}/artworks/${id}?fields=${ARTIC_DETAIL_FIELDS}`);
  if (!res.ok) throw new Error(`ARTIC detail fetch failed: ${res.status}`);
  const { data } = await res.json();

  return {
    id:           data.id,
    title:        data.title             || 'Untitled',
    artist:       data.artist_display    || 'Unknown Artist',
    date:         data.date_display      || 'Unknown Date',
    medium:       data.medium_display    || 'Unknown Medium',
    culture:      data.place_of_origin   || data.style_title || 'Unknown Origin',
    museum:       'Art Institute of Chicago',
    imageUrl:     data.image_id
      ? `${ARTIC_IMG_BASE}/${data.image_id}/full/1686,/0/default.jpg`
      : null,
    // Full-size URL — wider than dashboard thumbnails
    sourceUrl:    `https://www.artic.edu/artworks/${data.id}`,
    // Enriched fields — these are the "extra info not in dashboard"
    description:      data.description       || null,
    dimensions:       data.dimensions        || null,
    creditLine:       data.credit_line       || null,
    artworkType:      data.artwork_type_title || null,
    provenance:       data.provenance_text   || null,
  };
}

// ─── fetchMETDetail ───────────────────────────────────────────────────────────
// MET's object endpoint already returns full data in one call, so this is
// simpler — just fetch the object and pull extra fields.
export async function fetchMETDetail(id) {
  const res = await fetch(
    `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
  );
  if (!res.ok) throw new Error(`MET detail fetch failed: ${res.status}`);
  const data = await res.json();

  return {
    id:           data.objectID,
    title:        data.title             || 'Untitled',
    artist:       data.artistDisplayName || 'Unknown Artist',
    date:         data.objectDate        || 'Unknown Date',
    medium:       data.medium            || 'Unknown Medium',
    culture:      data.culture || data.period || 'Unknown Origin',
    museum:       'The Metropolitan Museum of Art',
    imageUrl:     data.primaryImage      || null,
    sourceUrl:    data.objectURL || `https://www.metmuseum.org/art/collection/search/${data.objectID}`,
    // Enriched fields
    description:  null, // MET doesn't provide prose descriptions via API
    dimensions:   data.dimensions        || null,
    creditLine:   data.creditLine        || null,
    artworkType:  data.objectName        || null,
    provenance:   null,
    // MET-specific extras worth showing
    dynasty:      data.dynasty           || null,
    period:       data.period            || null,
    repository:   data.repository        || null,
    GalleryNumber: data.GalleryNumber    || null,
  };
}