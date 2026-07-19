// ─── Gallery.jsx ──────────────────────────────────────────────────────────────
// Displays the session history of discovered artworks as thumbnail cards.
// Each card shows the image and title of a previously viewed artwork.
//
// This component receives the gallery array from App.jsx (via props).
// The gallery array is built up over the session in App.jsx using useEffect.
//
// Props:
//   gallery — array of normalized artwork objects (most recent first)
// ─────────────────────────────────────────────────────────────────────────────


import './Gallery.css'; // ← THIS WAS THE MISSING LINE
 
const Gallery = ({ gallery }) => {
  return (
    <div className="gallery">
      <h3 className="gallery__title">Gallery</h3>
 
      {gallery.length === 0 ? (
        <p className="gallery__empty">Artworks you discover will appear here.</p>
      ) : (
        <div className="gallery__grid">
          {gallery.map((artwork, index) => (
            <div key={index} className="gallery__card">
 
              {artwork.imageUrl ? (
                <img
                  className="gallery__card-image"
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="gallery__card-no-image">No image</div>
              )}
 
              <p className="gallery__card-title">{artwork.title}</p>
              <p className="gallery__card-museum">{artwork.museum}</p>
 
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
 
export default Gallery;
 