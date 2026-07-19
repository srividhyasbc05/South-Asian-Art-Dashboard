// ── DetailView.jsx ────────────────────────────────────────────────────────────
// This is the route component — the one React Router renders at /artwork/:artworkId
// It lives in src/routes/ per your module's convention.
//
// Its only job: read the artworkId from the URL and pass it to DetailPage.
// All the actual display logic lives in DetailPage (src/pages/DetailPage.jsx).
//
// WHY SPLIT IT THIS WAY?
// Your module's convention puts route-level components in src/routes/ and
// reusable display components in src/pages/ or src/components/.
// DetailPage could theoretically be used in other contexts (e.g. embedded
// in a modal later). Keeping the URL-reading logic here keeps DetailPage clean.
//
// useParams() — reads the :artworkId segment from the current URL.
// If the URL is /artwork/artic-105497, then:
//   const { artworkId } = useParams()
//   artworkId === "artic-105497"
// The name "artworkId" must match the :artworkId in the Route path exactly.
// ─────────────────────────────────────────────────────────────────────────────

import { useParams } from 'react-router-dom'
import DetailPage from '../components/DetailPage'

const DetailView = () => {
  // useParams returns an object with all the URL parameters for the current route.
  // We destructure to get just the one we named in main.jsx: :artworkId
  const { artworkId } = useParams()

  return <DetailPage artworkId={artworkId} />
}

export default DetailView