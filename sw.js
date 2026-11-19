// service worker: מאפשר התקנה כאפליקציה ושיתוף מוואטסאפ ללו"ז. בלי מטמון של הדף, כדי שעדכונים יופיעו מיד.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'POST' && u.pathname.endsWith('/share')) {
    e.respondWith((async () => {
      const back = new URL('./?a=share', self.registration.scope).href;
      try {
        const f = await e.request.formData();
        const c = await caches.open('share');
        const text = [f.get('title'), f.get('text'), f.get('url')].filter(x => x && typeof x === 'string').join('\n');
        await c.put('share-text', new Response(text));
        const file = f.get('image');
        if (file && file.size) await c.put('share-file', new Response(file, { headers: { 'content-type': file.type || 'image/jpeg' } }));
        else await c.delete('share-file');
      } catch (err) {}
      return Response.redirect(back, 303);
    })());
  }
});

// התראה קופצת כשבן/בת הזוג עדכנו משהו. ההתראה מגיעה בלי תוכן, כדי שפרטי הלו"ז לא יעברו דרך שרתים חיצוניים.
self.addEventListener('push', e => {
  e.waitUntil(self.registration.showNotification('הלו"ז שלנו', {
    body: 'יש עדכון חדש בלו"ז. לחצו כדי לראות.',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'luz-update', renotify: true,
    requireInteraction: true, vibrate: [200, 100, 200], dir: 'rtl', lang: 'he'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { c.postMessage({ type: 'refresh' }); return c.focus(); } }
    return self.clients.openWindow(self.registration.scope);
  })());
});
