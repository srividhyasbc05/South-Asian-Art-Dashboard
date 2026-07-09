import { useState } from 'react';
import './DashboardFilters.css';
 
const DashboardFilters = ({
  searchQuery,
  onSearchChange,
  activeFilters,
  onFilterChange,
  filterOptions,
}) => {
 
  // Which filter sections are open. museum starts open, others start closed.
  // This is the state that drives the collapsible behavior — nothing else.
  const [openSections, setOpenSections] = useState({
    museum:  true,
    artist:  false,
    medium:  false,
    culture: false,
  });
 
  // Toggle one section open/closed without affecting the others.
  // [key] is computed property syntax — uses the variable's value as the
  // property name. Without it you'd need if(key==="museum") etc for every one.
  function toggleSection(key) {
    setOpenSections(prev => ({
      ...prev,          // keep all other sections unchanged
      [key]: !prev[key] // flip just this one
    }));
  }
 
  // The four filter categories we display, in order.
  // "key" must match both the activeFilters object keys AND the filterOptions keys.
  const FILTER_CATEGORIES = [
    { key: "museum",  label: "Museum"  },
    { key: "artist",  label: "Artist"  },
    { key: "medium",  label: "Medium"  },
    { key: "culture", label: "Culture" },
  ];
 
  return (
    <aside className="dashboard-filters">
 
      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div className="dashboard-filters__search-section">
        <label className="dashboard-filters__search-label" htmlFor="artwork-search">
          Search
        </label>
        <input
          id="artwork-search"
          className="dashboard-filters__search-input"
          type="text"
          placeholder="Search for an artwork…"
          value={searchQuery}
          // onChange fires on every keystroke. e.target.value is the current
          // input text. We pass it up to DashboardPage which owns the state.
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
 
      {/* ── Filter by label ───────────────────────────────────────────────── */}
      <p className="dashboard-filters__filter-label">Filter by</p>
 
      {/* ── One collapsible section per filter category ───────────────────── */}
      {FILTER_CATEGORIES.map(({ key, label }) => (
        <div key={key} className="filter-section">
 
          {/* Section header — clicking toggles open/closed */}
          <button
            className={`filter-section__header ${openSections[key] ? "filter-section__header--open" : ""}`}
            onClick={() => toggleSection(key)}
            // aria-expanded tells screen readers whether the section is open
            aria-expanded={openSections[key]}
          >
            <span>{label}</span>
            {/* Chevron rotates via CSS when the --open modifier is applied */}
            <span className="filter-section__chevron">
              {openSections[key] ? "▾" : "▸"}
            </span>
            {/* Show count of active filters in this category */}
            {activeFilters[key].size > 0 && (
              <span className="filter-section__count">
                {activeFilters[key].size}
              </span>
            )}
          </button>
 
          {/* Section body — only rendered when section is open.
              {condition && <JSX>} renders the JSX if condition is true,
              renders nothing if false. This is called short-circuit rendering.
              The element is removed from the DOM entirely when closed —
              not just hidden with display:none. */}
          {openSections[key] && (
            <div className="filter-section__body">
              {/* One checkbox per unique value in this category */}
              {(filterOptions[key] || []).map((value) => (
                <label key={value} className="filter-section__option">
                  <input
                    type="checkbox"
                    className="filter-section__checkbox"
                    // checked if this value exists in the Set for this category
                    checked={activeFilters[key].has(value)}
                    // when toggled, tell DashboardPage which category + value changed
                    onChange={() => onFilterChange(key, value)}
                  />
                  <span className="filter-section__option-text">{value}</span>
                </label>
              ))}
 
              {/* Edge case: if no options exist yet (data still loading) */}
              {(filterOptions[key] || []).length === 0 && (
                <p className="filter-section__empty">Loading…</p>
              )}
            </div>
          )}
 
        </div>
      ))}
 
      {/* ── Clear all filters button ──────────────────────────────────────── */}
      {/* Only show when there are active filters or a search query */}
      {(searchQuery || Object.values(activeFilters).some(s => s.size > 0)) && (
        <button
          className="dashboard-filters__clear"
          onClick={() => {
            onSearchChange("");
            // Clear all filter categories by calling onFilterChange for each
            // active value — DashboardPage handles the actual state update
            // But simpler: we pass a special signal. Actually the cleanest
            // approach is to expose a separate onClearAll prop. Let's call
            // onSearchChange with a special value and handle it in parent.
            // ACTUALLY: let's just call onFilterChange with null to signal clear.
            // We'll add an onClearAll prop to make this cleaner.
            onFilterChange("__CLEAR_ALL__", null);
          }}
        >
          Clear all filters
        </button>
      )}
 
    </aside>
  );
};
 
export default DashboardFilters;