/* PWA: only when served over http(s) (e.g. GitHub Pages); a plain file or the artifact viewer is unaffected */
if (/^https?:$/.test(location.protocol)) {
  try {
    const l = document.createElement('link');
    l.rel = 'manifest';
    l.href = 'manifest.webmanifest';
    document.head.appendChild(l);
    const a = document.createElement('link');
    a.rel = 'apple-touch-icon';
    a.href = 'apple-touch-icon.png';
    document.head.appendChild(a);
    if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  } catch (e) {}
}
