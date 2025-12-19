import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle GitHub Pages SPA redirect - restore URL from query params
(function () {
  const l = window.location;
  
  // Check if we have redirect params from 404.html
  if (l.search.includes('p=') || l.search.includes('q=')) {
    const params = new URLSearchParams(l.search);
    const path = params.get('p')?.replace(/~and~/g, '&') || '';
    const query = params.get('q')?.replace(/~and~/g, '&') || '';
    
    // Reconstruct the original URL (just clear the redirect params, keep the hash)
    const base = import.meta.env.BASE_URL;
    let newUrl = base;
    if (path) {
      newUrl += path;
    }
    if (query) {
      newUrl += '?' + query;
    }
    newUrl += l.hash;
    
    // Replace the URL without reloading
    window.history.replaceState(null, '', newUrl);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
