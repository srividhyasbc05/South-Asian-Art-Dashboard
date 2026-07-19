// ─── BanList.jsx ──────────────────────────────────────────────────────────────
// Displays the current ban list and allows removing items from it.
//
// Props:
//   banList  — array of banned value strings, e.g. ["Raja Ravi Varma", "Bronze"]
//   onRemove — function from App.jsx to call when a banned item is clicked
//              to remove it. Receives the value string as argument.
import './BanList.css'

const BanList = ({ banList, onRemove }) => {
  return (
    <div className="ban-list">
      <h3 className="ban-list__title">Ban List</h3>
      {banList.length === 0 ? (
        <p className="ban-list__empty">
          Click any attribute tag to ban it from future results.
        </p>
      ) : (
        <>
          {/* Small hint text — only show when there are items */}
          <p className="ban-list__hint">Click a banned item to unban it.</p>
 
          {/* The list of banned values */}
          {/* .map() transforms each string in banList into a JSX element */}
          <ul className="ban-list__items">
            {banList.map((value) => (
              // key={value} is fine here because banned values are unique —
              // you can't have the same value in the ban list twice.
              <li
                key={value}
                className="ban-list__item"
                onClick={() => onRemove(value)}
                // role and cursor make this feel like a button to users
                // even though it's technically a list item
                role="button"
                style={{ cursor: "pointer" }}
              >
                {/* × is the HTML entity for ✕ — shows a remove icon */}
                <span className="ban-list__remove-icon">×</span>
                {value}
              </li>
            ))}
          </ul>
        </>
      )}

    </div>
      )
      }

    
export default BanList