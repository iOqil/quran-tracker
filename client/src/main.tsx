import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mobil ilova (Capacitor) uchun API manzilini to'g'rilash
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    // Agar ilova Capacitor (Android/iOS) ichida ishlayotgan bo'lsa va VITE_API_URL yo'q bo'lsa,
    // to'g'ridan-to'g'ri backend IP manzilingizga ulanadi. Veb-saytda esa oddiy ishlayveradi.
    const isCapacitor = !!(window as any).Capacitor;
    const fallbackUrl = isCapacitor ? 'http://37.60.238.251:5000' : '';
    const baseUrl = import.meta.env.VITE_API_URL || fallbackUrl;
    resource = baseUrl + resource;
  }
  return originalFetch(resource, config as RequestInit);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
