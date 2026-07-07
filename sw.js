const CACHE_NAME = 'geocam v2'; // <-- Recuerda cambiar a 'geocam-pro-v8' cuando subas cambios
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js'
];

// Instalación: Guarda todo en la memoria de la tablet
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activación: Limpia cachés antiguas y toma el control de las pestañas inmediatamente
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
    )).then(() => {
      // Fuerza a que el nuevo Service Worker controle la página web de inmediato sin esperar a reiniciar
      return self.clients.claim();
    })
  );
});

// Intercepción: Modo offline (sirve desde caché local)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// --- EL COMODÍN DE ACTUALIZACIÓN FORZADA (OBLIGATORIO) ---
// Escucha el mensaje "SKIP_WAITING" enviado desde el nuevo HTML y mata el proceso viejo
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
