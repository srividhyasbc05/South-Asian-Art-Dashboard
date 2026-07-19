import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import DetailView from './routes/DetailView.jsx'
import Layout from './routes/Layout.jsx'
import DiscoverPage from './DiscoverPage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* FIX: Comments inside JSX must be {/* */} not // 
           
        <Route path="/" element={<App />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route element={<Layout />}>
          <Route path="/artwork/:artworkId" element={<DetailView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)