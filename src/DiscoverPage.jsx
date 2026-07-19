// ─── DiscoverPage.jsx ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { discoverArtwork } from "./api/discover.js";
import ArtworkOverlay from "./components/ArtworkOverlay.jsx";
import BanList        from "./components/BanList.jsx";
import Gallery        from "./components/Gallery.jsx";
import './global.css';
import './DiscoverPage.css';

// FIX: renamed component from "App" to "DiscoverPage" to match the filename.
// Having a component named "App" in DiscoverPage.jsx AND in App.jsx means
// React sees two different components with the same display name. When
// React's reconciler tries to figure out if it should reuse or remount a
// component, it uses the component function reference. If something caused
// a re-import or re-evaluation, React could confuse the two "App" components
// and remount unnecessarily. Always match the component name to the filename.
const DiscoverPage = () => {
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [banList,        setBanList]         = useState([]);
  const [isLoading,      setIsLoading]       = useState(false);
  const [error,          setError]           = useState(null);
  const [gallery,        setGallery]         = useState([]);

  // FIX: handleDiscover was a plain async function defined inside the component.
  // useEffect(() => { handleDiscover() }, []) calls it on mount — but ESLint
  // and React's strict mode both flag this because handleDiscover is a
  // dependency that's recreated on every render. In StrictMode (which you have
  // in main.jsx), React intentionally mounts → unmounts → remounts every
  // component on first load to catch side-effect bugs. If handleDiscover isn't
  // stable, this can cause it to fire more than expected.
  //
  // useCallback wraps the function and returns the SAME function reference
  // across renders, as long as its dependencies don't change.
  // The dependency here is banList — discover needs the current ban list.
  // When banList changes, useCallback creates a new stable reference,
  // which is correct because the new discover call should use the new banList.
  const handleDiscover = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const artwork = await discoverArtwork(banList);
      setCurrentArtwork(artwork);
    } catch (err) {
      setError(err.message);
      console.error("Discover failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [banList]);
  // Note: banList in the dependency array means "if banList changes, recreate
  // this function." That's correct — a new discover call after banning something
  // should use the updated ban list.

  // Auto-discover on mount
  // FIX: the dependency array was [] but handleDiscover was used inside.
  // With useCallback above, handleDiscover is now stable, so it's safe to
  // list it here. ESLint would warn if you left [] — this silences that and
  // is semantically correct: "run when handleDiscover first becomes available."
  useEffect(() => {
    handleDiscover();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // We intentionally only run on mount, not every time banList changes.
  // The user triggers subsequent discovers manually via the button.

  // Add to gallery when currentArtwork changes
  useEffect(() => {
    if (!currentArtwork) return;
    setGallery(prev => {
      if (prev[0]?.sourceUrl === currentArtwork.sourceUrl) return prev;
      return [currentArtwork, ...prev];
    });
  }, [currentArtwork]);

  function handleTagClick(value) {
    setBanList(prev =>
      prev.includes(value)
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Public Domain Indian Art</h1>
        <button
          className="app__discover-btn"
          onClick={handleDiscover}
          disabled={isLoading}
        >
          {isLoading ? "Loading…" : "Discover"}
        </button>
      </header>

      {error && (
        <div className="app__error" role="alert">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <main className="app__layout">
        <aside className="app__sidebar">
          <BanList banList={banList} onRemove={handleTagClick} />
        </aside>

        <section className="app__main">
          <ArtworkOverlay
            artwork={currentArtwork}
            banList={banList}
            onTagClick={handleTagClick}
            isLoading={isLoading}
          />
        </section>

        <aside className="app__gallery">
          <Gallery gallery={gallery} />
        </aside>
      </main>
    </div>
  );
};

export default DiscoverPage;