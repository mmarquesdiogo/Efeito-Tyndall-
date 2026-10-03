// Guarda a página no aparelho para ela abrir mesmo sem internet
const CACHE = 'tyndall-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  // 'reload' pula o cache do navegador: a versão nova chega inteira
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tyndall-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function save(req, res) {
  if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
  return res;
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!same && !fonts) return;
  // responde na hora com o que está guardado e atualiza em segundo plano
  e.respondWith(caches.match(req, { ignoreSearch: same }).then(hit => {
    const net = (same ? fetch(req.url, { cache: 'no-cache' }) : fetch(req)).then(res => save(req, res)).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return net.then(res => res || (req.mode === 'navigate' ? caches.match('./') : Response.error()));
  }));
});
