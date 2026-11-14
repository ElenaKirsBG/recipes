/* «Мои рецепты» — © 2026 Elena Kirsanova. Все права защищены. */
const VERSION = 'recepty-v1.0.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const RUNTIME = 'recepty-runtime';
// сервисы ИИ никогда не кэшируем
const NEVER = /generativelanguage\.googleapis\.com|api\.anthropic\.com/;
// шрифты и модуль офлайн-распознавания кэшируем для работы без интернета
const CACHEABLE = /fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|tessdata|unpkg\.com/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || NEVER.test(req.url)) return;
  const url = new URL(req.url);
  if (url.origin === location.origin){
    // приложение: сначала сеть (чтобы обновления приходили), при отсутствии сети — кэш
    e.respondWith(fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
    return;
  }
  if (CACHEABLE.test(req.url)){
    e.respondWith(caches.open(RUNTIME).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
