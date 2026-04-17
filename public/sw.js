// Minimal Service Worker to enable PWA installation
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Minimal fetch logic to satisfy PWA requirements
});
