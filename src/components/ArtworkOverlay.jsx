import './ArtworkOverlay.css';
 
const ArtworkOverlay = ({ artwork, onClose }) => {
  if (!artwork) return null; // safety check — nothing selected = nothing rendered
 
  return (
    // The outer div IS the dark backdrop. Clicking it closes the overlay.
    <div className="overlay" onClick={onClose} role="dialog" aria-modal="true">
 
      {/* The content panel. e.stopPropagation() prevents clicks inside
          the panel from bubbling up to the backdrop div above, which would
          immediately close the overlay when you click any content. */}
      <div
        className="overlay__panel"
        onClick={(e) => e.stopPropagation()}
      >
 
        {/* Close button — top right corner */}
        <button
          className="overlay__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
 
        {/* Left half: artwork image */}
        <div className="overlay__image-side">
          {artwork.imageUrl ? (
            <img
              className="overlay__image"
              src={artwork.imageUrl}
              alt={artwork.title}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="overlay__image-placeholder">No image available</div>
          )}
        </div>
 
        {/* Right half: metadata */}
        <div className="overlay__info-side">
          <h2 className="overlay__title">{artwork.title}</h2>
 
          {/* Metadata rows — label + value pairs */}
          <dl className="overlay__metadata">
            <dt className="overlay__meta-label">Artist</dt>
            <dd className="overlay__meta-value">{artwork.artist}</dd>
 
            <dt className="overlay__meta-label">Date</dt>
            <dd className="overlay__meta-value">{artwork.date}</dd>
 
            <dt className="overlay__meta-label">Medium</dt>
            <dd className="overlay__meta-value">{artwork.medium}</dd>
 
            <dt className="overlay__meta-label">Culture / Origin</dt>
            <dd className="overlay__meta-value">{artwork.culture}</dd>
 
            <dt className="overlay__meta-label">Museum</dt>
            <dd className="overlay__meta-value">{artwork.museum}</dd>
          </dl>
 
          {/* External link to the museum's own page for this work */}
          <a
            className="overlay__source-link"
            href={artwork.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on museum website ↗
          </a>
        </div>
 
      </div>
    </div>
  );
};
 
export default ArtworkOverlay;
 