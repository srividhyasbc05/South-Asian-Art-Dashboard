
import { useState, useEffect } from 'react';
import { fetchAllArtworks, computeStats } from './api/fetchAll.js';   // Fix 1: ./ not ../
import DashboardStats   from './components/DashboardStats.jsx';
import DashboardFilters from './components/DashboardFilters.jsx';
import DashboardRow     from './components/DashboardRow.jsx';
import ArtworkOverlay   from './components/ArtworkOverlay.jsx';
import './App.css';
import './global.css';

const DashboardPage = () => {

  // ── Core data state ──────────────────────────────────────────────────────
  // masterList: every artwork fetched from the API. We NEVER filter this.
  //   It's the "source of truth" — applyFilters() always starts from this.
  //   If we filtered masterList directly, we'd lose artworks permanently and
  //   couldn't restore them when filters are removed.
  //
  // filteredList: the subset of masterList that passes current search + filters.
  //   This is what the table actually displays.
  //
  // They start as the same empty array. After the data loads, masterList is
  // set once and never changed again. filteredList gets replaced on every
  // search/filter interaction.
  const [masterList,    setMasterList]    = useState([]);
  const [filteredList,  setFilteredList]  = useState([]);
  const [stats,         setStats]         = useState({ total: 0, topCulture: "—", topMedium: "—" });
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState(null);

  // ── Search and filter state ───────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");

  // activeFilters: which checkboxes are checked.
  // Shape: { museum: Set, artist: Set, medium: Set, culture: Set }
  // We use Set (not array) because Set.has() is O(1) lookup — much faster
  // than array.includes() when you're checking hundreds of artworks.
  // An empty Set for a category means "no filter applied for this category."
  const [activeFilters, setActiveFilters] = useState({
    museum:  new Set(),
    artist:  new Set(),
    medium:  new Set(),
    culture: new Set(),
  });

  // filterOptions: the unique values available for each filter category.
  // These populate the checkbox lists in DashboardFilters.
  // Shape: { museum: ["AIC", "Met"], artist: ["Unknown", "Raja Ravi Varma", ...], ... }
  // Fix 2: this was missing entirely — useState was never called, so
  // setFilterOptions didn't exist and calling it threw "not a function".
  const [filterOptions, setFilterOptions] = useState({
    museum:  [],
    artist:  [],
    medium:  [],
    culture: [],
  });

  // selectedArtwork: the artwork whose overlay is currently open.
  // null = no overlay shown.
  // Fix 3: this was commented out but the JSX still used it.
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  // ── Data loading effect ───────────────────────────────────────────────────
  // useEffect with [] runs exactly once: after the component first renders.
  // This is the correct place for initial data fetching — not in the render
  // body, because the render body runs every time ANY state changes, which
  // would re-fetch on every keystroke in the search box.
  useEffect(() => {
    async function loadArtworks() {
      try {
        const artworks = await fetchAllArtworks();

        setMasterList(artworks);
        setFilteredList(artworks);   // initially show everything
        setStats(computeStats(artworks));

        // Build unique sorted value lists for each filter category.
        // new Set() deduplicates — if 30 artworks say "Unknown Artist",
        // the filter list only shows "Unknown Artist" once.
        // Spread [...set] converts Set back to array so we can call .sort().
        const unique = (field) =>
          [...new Set(artworks.map(a => a[field]).filter(Boolean))].sort();

        setFilterOptions({
          museum:  unique("museum"),
          artist:  unique("artist"),
          medium:  unique("medium"),
          culture: unique("culture"),
        });

      } catch (err) {
        setError(err.message);
        console.error("Dashboard load failed:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadArtworks();
  }, []); // empty array = "run once on mount"

  // ── applyFilters ──────────────────────────────────────────────────────────
  // The core filtering function. Takes the latest query + filters and rebuilds
  // filteredList from scratch by filtering masterList.
  //
  // WHY DOES IT TAKE query AND filters AS PARAMETERS INSTEAD OF READING
  // FROM STATE DIRECTLY?
  //
  // React state updates are ASYNCHRONOUS. When you call setSearchQuery(newQ)
  // and then read searchQuery on the very next line, searchQuery STILL HAS
  // THE OLD VALUE. React hasn't re-rendered yet — the state variable doesn't
  // update until the next render cycle.
  //
  // So instead of reading from state, we pass the NEW values in as parameters.
  // This guarantees applyFilters always works with the values we just set,
  // not the stale values from the previous render.
  function applyFilters(query, filters) {
    let results = masterList; // always start from the COMPLETE unfiltered list

    // Apply each checkbox category as a successive narrowing filter.
    // Object.entries(filters) converts { museum: Set, artist: Set, ... }
    // into [["museum", Set], ["artist", Set], ...] so we can loop over it.
    Object.entries(filters).forEach(([category, valueSet]) => {
      if (valueSet.size > 0) {
        // Only filter if at least one checkbox is checked in this category.
        // "Keep this artwork if its value for this category is in the checked set."
        results = results.filter(item => valueSet.has(item[category]));
      }
      // If the Set is empty (nothing checked), we keep ALL artworks for that
      // category — empty set = "no restriction on this category."
    });

    // Apply text search on top of the checkbox results.
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      results = results.filter(item =>
        item.title.toLowerCase().includes(q)   ||
        item.artist.toLowerCase().includes(q)  ||
        item.culture.toLowerCase().includes(q) ||
        item.medium.toLowerCase().includes(q)
      );
    }

    setFilteredList(results);
  }

  // ── handleSearchChange ────────────────────────────────────────────────────
  // Called on every keystroke in the search input.
  // Sets the new query in state, then immediately applies filters using the
  // NEW query value (not waiting for re-render to read it from state).
  function handleSearchChange(query) {
    setSearchQuery(query);
    applyFilters(query, activeFilters); // pass new query directly
  }

  // ── handleFilterChange ────────────────────────────────────────────────────
  // Called when any checkbox is toggled, or when "Clear all" is clicked.
  //
  // The "__CLEAR_ALL__" special signal: DashboardFilters can't directly
  // reset the filter state (that state lives here in App.jsx, not in
  // DashboardFilters). So it passes a special sentinel string as the
  // category name. We check for it here and reset everything.
  // This is a simple pattern — an alternative would be passing a separate
  // onClearAll prop, but one prop is simpler than two.
  function handleFilterChange(category, value) {
    if (category === "__CLEAR_ALL__") {
      const cleared = {
        museum: new Set(), artist: new Set(), medium: new Set(), culture: new Set(),
      };
      setActiveFilters(cleared);
      setSearchQuery("");
      applyFilters("", cleared);
      return;
    }

    // Build the updated filters object.
    // We can't mutate the existing Set directly — React won't detect the
    // change and re-render. We must create a NEW Set, modify it, and set
    // a NEW object with that new Set.
    const updatedFilters = {
      ...activeFilters,    // spread all existing category Sets (unchanged ones)
      [category]: (() => {
        const s = new Set(activeFilters[category]); // copy the current Set
        s.has(value) ? s.delete(value) : s.add(value); // toggle
        return s;
      })(),
    };

    setActiveFilters(updatedFilters);
    applyFilters(searchQuery, updatedFilters); // apply with new filters immediately
  }

  // ── Render: loading state ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard-page dashboard-page--loading">
        <div className="dashboard-page__spinner" />
        <p>Loading artworks…</p>
      </div>
    );
  }

  // ── Render: error state ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dashboard-page dashboard-page--error">
        <p>Failed to load artworks: {error}</p>
      </div>
    );
  }

  // ── Render: normal state ──────────────────────────────────────────────────
  return (
    <div className="dashboard-page">

      {/* Overlay — sits on top of everything. ArtworkOverlay renders nothing
          when artwork prop is null, so this is always safe to include. */}
      <ArtworkOverlay
        artwork={selectedArtwork}
        onClose={() => setSelectedArtwork(null)}
      />

      <h1 className="dashboard-page__title">Public Domain Indian Art Dashboard</h1>

      <DashboardStats stats={stats} filteredCount={filteredList.length} />

      <div className="dashboard-page__body">

        <DashboardFilters
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
        />

        <div className="dashboard-page__table-wrapper">
          {filteredList.length === 0 ? (
            <div className="dashboard-page__empty">
              No artworks match your current search or filters.
            </div>
          ) : (
            <table className="dashboard-table">
              <thead className="dashboard-table__head">
                <tr>
                  <th className="dashboard-table__th">Image</th>
                  <th className="dashboard-table__th">Name of the piece</th>
                  <th className="dashboard-table__th">Museum</th>
                  <th className="dashboard-table__th">Artist Name</th>
                  <th className="dashboard-table__th">Medium</th>
                  <th className="dashboard-table__th">Culture</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(artwork => (
                  <DashboardRow
                    key={artwork.id}
                    artwork={artwork}
                    onClick={setSelectedArtwork}
                  />
                ))}
              </tbody>
            </table>
          )}

          <p className="dashboard-page__count">
            Showing {filteredList.length} of {masterList.length} artworks
          </p>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;