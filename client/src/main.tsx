import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mobil ilova (Capacitor) uchun API manzilini to'g'rilash
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    // Agar VITE_API_URL berilmagan bo'lsa (veb versiya), o'zi turgan domendan oladi
    const baseUrl = import.meta.env.VITE_API_URL || '';
    resource = baseUrl + resource;
  }
  return originalFetch(resource, config as RequestInit);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
