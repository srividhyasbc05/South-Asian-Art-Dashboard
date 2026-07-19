// ── DetailPage.jsx ────────────────────────────────────────────────────────────
// Displays full detail for one artwork. Receives artworkId as a prop from
// DetailView (which read it from the URL with useParams).
//
// artworkId format: "artic-105497" or "met-12345"
// We split on the first hyphen to get the museum name and the raw numeric ID.
//
// RESPONSIVE LAYOUT:
// When the image loads, onLoad fires and we check its natural dimensions.
// naturalWidth and naturalHeight are the image's actual pixel dimensions.
// If height > width by more than 10%, we treat it as portrait.
// Portrait → vertical stacked layout. Landscape/square → side by side.
//
// NO useNavigate — navigation handled by the back button in Layout.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { fetchARTICDetail, fetchMETDetail } from '../api/fetchDetail'
import AttributeTag from '../components/AttributeTag'
import '../components/AttributeTag.css'
import './DetailPage.css'

async function handleDownload(imageUrl, title) {
  try {
    const res      = await fetch(imageUrl)
    const blob     = await res.blob()
    const localUrl = URL.createObjectURL(blob)
    const link     = document.createElement('a')
    link.href     = localUrl
    link.download = (title || 'artwork').replace(/[^a-z0-9]/gi, '_').slice(0, 60) + '.jpg'
    link.click()
    URL.revokeObjectURL(localUrl)
  } catch {
    window.open(imageUrl, '_blank')
  }
}

const ATTRIBUTE_CONFIG = [
  { key: 'artist',  label: 'Artist'  },
  { key: 'date',    label: 'Date'    },
  { key: 'medium',  label: 'Medium'  },
  { key: 'culture', label: 'Culture' },
]

const DetailPage = ({ artworkId }) => {
  const [artwork,    setArtwork]    = useState(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState(null)
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    if (!artworkId) return

    const hyphenPos = artworkId.indexOf('-')
    const museum = artworkId.slice(0, hyphenPos)
    const rawId  = artworkId.slice(hyphenPos + 1)

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const detail = museum === 'artic'
          ? await fetchARTICDetail(rawId)
          : await fetchMETDetail(rawId)
        setArtwork(detail)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
    window.scrollTo(0, 0)
  }, [artworkId])

  function handleImageLoad(e) {
    const { naturalWidth, naturalHeight } = e.target
    setIsPortrait(naturalHeight > naturalWidth * 1.1)
  }

  if (isLoading) {
    return (
      <div className="detail-page detail-page--loading">
        <div className="detail-page__spinner" />
        <p>Loading artwork...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="detail-page detail-page--error">
        <p>Could not load this artwork: {error}</p>
      </div>
    )
  }

  if (!artwork) return null

  return (
    <div className={`detail-page ${isPortrait ? 'detail-page--portrait' : 'detail-page--landscape'}`}>
      <div className="detail-page__panel">

        <div className="detail-page__image-side">
          {artwork.imageUrl ? (
            <img
              className="detail-page__image"
              src={artwork.imageUrl}
              alt={artwork.title}
              onLoad={handleImageLoad}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="detail-page__image-placeholder">No image available</div>
          )}
        </div>

        <div className="detail-page__info-side">
          <h1 className="detail-page__title">{artwork.title}</h1>

          <div className="detail-page__tags">
            {ATTRIBUTE_CONFIG.map(({ key, label }) => (
              <AttributeTag
                key={key}
                label={label}
                value={artwork[key]}
                isBanned={false}
                onClick={() => {}}
              />
            ))}
            <div className="attribute-tag" style={{ cursor: 'default', opacity: 0.7 }}>
              <span className="attribute-tag__label">Museum</span>
              <span className="attribute-tag__value">{artwork.museum}</span>
            </div>
          </div>

          <p className="detail-page__meta-intro">some additional metadata about the piece</p>

          <table className="detail-page__meta-table">
            <tbody>
              {artwork.artworkType && (
                <tr>
                  <td className="detail-page__meta-label">Type</td>
                  <td className="detail-page__meta-value">{artwork.artworkType}</td>
                </tr>
              )}
              {artwork.dimensions && (
                <tr>
                  <td className="detail-page__meta-label">Dimensions</td>
                  <td className="detail-page__meta-value">{artwork.dimensions}</td>
                </tr>
              )}
              {artwork.creditLine && (
                <tr>
                  <td className="detail-page__meta-label">Credit</td>
                  <td className="detail-page__meta-value">{artwork.creditLine}</td>
                </tr>
              )}
              {artwork.dynasty && (
                <tr>
                  <td className="detail-page__meta-label">Dynasty</td>
                  <td className="detail-page__meta-value">{artwork.dynasty}</td>
                </tr>
              )}
              {artwork.period && (
                <tr>
                  <td className="detail-page__meta-label">Period</td>
                  <td className="detail-page__meta-value">{artwork.period}</td>
                </tr>
              )}
              {artwork.GalleryNumber && (
                <tr>
                  <td className="detail-page__meta-label">Gallery</td>
                  <td className="detail-page__meta-value">{artwork.GalleryNumber}</td>
                </tr>
              )}
            </tbody>
          </table>

          {artwork.description && (
            <div
              className="detail-page__description"
              dangerouslySetInnerHTML={{ __html: artwork.description }}
            />
          )}

          <div className="detail-page__actions">
            <a
              href={artwork.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-page__source-link"
            >
              View on museum website
            </a>
            {artwork.imageUrl && (
              <button
                className="detail-page__download"
                onClick={() => handleDownload(artwork.imageUrl, artwork.title)}
              >
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DetailPage