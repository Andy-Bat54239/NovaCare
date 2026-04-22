import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Apply persisted theme before React mounts so there's no light/dark flash.
try {
  const prefs = JSON.parse(localStorage.getItem('novacare_prefs')) || {};
  const theme = prefs.display?.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
} catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
