import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Inter Variable, autoalojada — la misma que la landing (Layout.astro).
import '@fontsource-variable/inter'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
