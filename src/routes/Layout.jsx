// ── Layout.jsx ────────────────────────────────────────────────────────────────
// A wrapper component that adds a "back home" button to every page nested
// under it (currently just DetailView).
//
// HOW NESTED ROUTES WORK:
// In main.jsx we wrote:
//   <Route element={<Layout />}>
//     <Route path="/artwork/:artworkId" element={<DetailView />} />
//   </Route>
//
// React Router renders Layout, then looks for an <Outlet /> inside it.
// <Outlet /> is a placeholder — React Router fills it with the matched
// child route's component. So the page renders:
//   Layout (back button at top)
//     └── DetailView (the actual artwork content)
//
// This means if you add more routes under Layout later (like a Lookbook
// detail page), they ALL automatically get the back button.
//
// DYNAMIC BACK BUTTON:
// We use useLocation() to read the current URL, then check where the user
// came from — but since we can't always know that reliably without Context,
// we show "← Dashboard" because Dashboard is the primary entry point and
// always exists at "/". If they came from Discover they can use the browser
// back button or click Dashboard to get back.
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet, Link } from 'react-router-dom'
import './Layout.css'

const Layout = () => {
  return (
    <div className="layout">
      {/* Back button — Link component does client-side navigation (no page reload).
          Using Link instead of <a href="/"> prevents a full page refresh.
          to="/" always goes to Dashboard which is the home page. */}
      <div className="layout__nav">
        <Link to="/" className="layout__back-btn">
          ←
        </Link>
      </div>

      {/* Outlet is where React Router renders the matched child route.
          Without Outlet here, the child route's component would never render. */}
      <Outlet />
    </div>
  )
}

export default Layout