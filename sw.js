self.addEventListener('install', (e) => {
    console.log("PWA Instalado!");
});

self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request));
});
