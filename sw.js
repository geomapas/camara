const CACHE_NAME = 'geocam v2.3.2'; // <-- Recuerda cambiar este número cada vez que subas cambios

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

// Instalación: guarda todo lo que pueda en caché, pero SIN abortar si falla
// algún recurso puntual (p. ej. un CDN externo con un fallo momentáneo).
// Antes, un solo fallo con cache.addAll() cancelaba TODA la instalación y
// dejaba el dispositivo sin ningún archivo cacheado, sin ningún aviso.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const resultados = await Promise.allSettled(
        ASSETS.map((url) => cache.add(url))
      );
      const fallidos = resultados
        .map((r, i) => (r.status === 'rejected' ? ASSETS[i] : null))
        .filter(Boolean);
      if (fallidos.length > 0) {
        console.warn('SW: no se pudieron cachear estos recursos en la instalación:', fallidos);
      } else {
        console.log('SW: todos los recursos se cachearon correctamente.');
      }
      // No lanzamos error aunque haya fallidos: preferimos tener cacheado
      // lo máximo posible (sobre todo el propio index.html) a no tener nada.
    })
  );
});

// Activación: limpia cachés antiguas y toma el control de las pestañas de inmediato
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
    )).then(() => {
      return self.clients.claim();
    })
  );
});

// Intercepción: modo offline (sirve desde caché local).
// Añadido: si es una navegación (el usuario abriendo/recargando la app) y
// falla tanto el caché exacto como la red, recurrimos siempre al
// index.html cacheado como último recurso, para que la app cargue igual
// aunque la URL exacta solicitada no coincida con la cacheada.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return Response.error();
      });
    })
  );
});

// Comodín de actualización forzada: escucha "SKIP_WAITING" desde el HTML
// y mata el proceso viejo
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
