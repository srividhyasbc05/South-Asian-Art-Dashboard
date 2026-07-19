// ── DashboardRow.jsx ──────────────────────────────────────────────────────────
// One row in the dashboard table.
// The title cell is a React Router <Link> that navigates to the detail page.
//
// WHY LINK AND NOT <a href>?
// <a href="/artwork/artic-105497"> causes a full page reload — the browser
// fetches the page from scratch. React Router's <Link to="..."> does
// client-side navigation: the URL changes but React stays mounted, which is
// faster and preserves any state in parent components.
//
// The `to` prop uses a template literal (backticks) to build the URL:
//   to={`/artwork/${artwork.id}`}
// artwork.id is already "artic-105497" or "met-12345" from normalization,
// so this produces "/artwork/artic-105497" — matching our route pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom'
import './DashboardRow.css'

const DashboardRow = ({ artwork }) => {
  return (
    <tr className="dashboard-row">

      {/* Thumbnail */}
      <td className="dashboard-row__cell dashboard-row__cell--image">
        {artwork.imageUrl ? (
          <img
            className="dashboard-row__thumbnail"
            src={artwork.imageUrl}
            alt={artwork.title}
            onError={(e) => {
              e.target.style.display = 'none'
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className="dashboard-row__thumbnail-placeholder"
          style={{ display: artwork.imageUrl ? 'none' : 'flex' }}
        >?</div>
      </td>

      {/* Title — this is the Link to the detail page */}
      <td className="dashboard-row__cell dashboard-row__cell--title">
        <Link
          to={`/artwork/${artwork.id}`}
          className="dashboard-row__link"
        >
          {artwork.title}
        </Link>
      </td>

      <td className="dashboard-row__cell">{artwork.museum}</td>
      <td className="dashboard-row__cell">{artwork.artist}</td>
      <td className="dashboard-row__cell dashboard-row__cell--medium">{artwork.medium}</td>
      <td className="dashboard-row__cell">{artwork.culture}</td>
    </tr>
  )
}

export default DashboardRow