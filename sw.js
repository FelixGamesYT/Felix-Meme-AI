// Service Worker Minimalista para PWA (Ativação e Instalação)
self.addEventListener('install', (e) => {
  console.log('PWA Instalado!');
});

self.addEventListener('fetch', (e) => {
  // Mantém o app funcionando online (não faz cache agressivo para evitar erros)
  e.respondWith(fetch(e.request));
});
