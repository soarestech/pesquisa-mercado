const CACHE_NAME = "pesquisa-mercados-v2"; // incrementado!

const urlsToCache = [
  "./index.html",
  "./script.js",
  "./style.css",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11"
];

// Instalando o SW e adicionando arquivos ao cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ativação do SW e limpeza de caches antigos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Interceptando requisições para usar cache quando offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
