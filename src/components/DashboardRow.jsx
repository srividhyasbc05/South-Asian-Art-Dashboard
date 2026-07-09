// ─── DashboardRow.jsx ─────────────────────────────────────────────────────────
// Renders one row in the dashboard table.
//
// FIX: onClick, role, tabIndex, and onKeyDown were missing from the <tr>.
// Without these, clicking a row does nothing — the onClick prop is received
// but never wired to anything.
//
// WHY ALL FOUR ATTRIBUTES TOGETHER?
// ──────────────────────────────────
// onClick alone would make it work with a mouse. But <tr> is not a button —
// it's a table row. Browsers and screen readers don't treat it as interactive
// by default. To make it FULLY accessible:
//
//   role="button"     — tells screen readers "this element acts like a button"
//   tabIndex={0}      — makes the row focusable with the Tab key
//                       (by default only form elements and links are tab-focusable)
//   onKeyDown         — lets keyboard users press Enter or Space to activate it
//                       (mouse users get onClick; keyboard users need this)
//
// Without tabIndex + role, a keyboard user could never reach or activate
// the row. Without onKeyDown, tabbing to the row and pressing Enter does nothing.
// ─────────────────────────────────────────────────────────────────────────────

import './DashboardRow.css';

const DashboardRow = ({ artwork, onClick }) => {
  return (
    <tr
      className="dashboard-row"
      onClick={() => onClick(artwork)}       // Fix: wire up the click
      role="button"                          // Fix: semantic hint for screen readers
      tabIndex={0}                           // Fix: makes row Tab-focusable
      onKeyDown={(e) => {                    // Fix: keyboard activation
        // Enter key (13) and Space bar (32) should behave like a click
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); // prevent Space from scrolling the page
          onClick(artwork);
        }
      }}
    >
      {/* Image cell */}
      <td className="dashboard-row__cell dashboard-row__cell--image">
        {artwork.imageUrl ? (
          <img
            className="dashboard-row__thumbnail"
            src={artwork.imageUrl}
            alt={artwork.title}
            onError={(e) => {
              e.target.style.display = "none";
              // Show the placeholder sibling div when the image fails
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}

        {/* Hidden placeholder — shown by onError above if image fails to load */}
        <div
          className="dashboard-row__thumbnail-placeholder"
          style={{ display: artwork.imageUrl ? "none" : "flex" }}
        >
          ?
        </div>
      </td>

      <td className="dashboard-row__cell dashboard-row__cell--title">
        {artwork.title}
      </td>

      <td className="dashboard-row__cell">{artwork.museum}</td>
      <td className="dashboard-row__cell">{artwork.artist}</td>

      <td className="dashboard-row__cell dashboard-row__cell--medium">
        {artwork.medium}
      </td>

      <td className="dashboard-row__cell">{artwork.culture}</td>
    </tr>
  );
};

export default DashboardRow;