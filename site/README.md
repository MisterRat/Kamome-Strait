# site/

What GitHub Pages serves besides the game (`.github/workflows/pages.yml`): the web app manifest, the service worker that
lets the game run offline, and the icons. The workflow publishes `build/Kamome_Strait.html` (the landing page with every
simulator) as `index.html` next to these files. `src/shared/pwa-only-when-served-over-http-s-e-g-github-page.js` links them
only when the page is served over http(s), so a local copy is unaffected.
