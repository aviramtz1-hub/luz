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

// התראה קופצת: עדכון מבן/בת הזוג, או סיכום הבוקר. ההתראה מגיעה בלי תוכן, והטלפון עצמו שואל את הלו"ז מה לכתוב.
// כך פרטי הלו"ז לא עוברים דרך שרתים חיצוניים. אם השאלה נכשלת, מוצגת הודעה כללית.
self.window = self; try { importScripts('config.js'); } catch (e) {}
async function pushContent() {
  const generic = { title: 'הלו"ז שלנו', body: 'יש עדכון חדש בלו"ז. לחצו כדי לראות.', tag: 'luz-update', sticky: true };
  try {
    const c = await caches.open('cfg'); const r = await c.match('cfg'); if (!r || !self.LUZ_API) return generic;
    const cfg = await r.json(); if (!cfg.k) return generic;
    const res = await fetch(self.LUZ_API, { method: 'POST', body: JSON.stringify({ fn: 'pushText', args: [cfg.k, cfg.me || ''] }) });
    const j = await res.json(); if (!j.ok) return generic;
    const lines = j.data.lines || [];
    if (j.data.unseen) return { title: 'יש עדכון חדש בלו"ז', body: lines.length ? 'היום:\n' + lines.join('\n') : 'לחצו כדי לראות.', tag: 'luz-update', sticky: true };
    if (lines.length) return { title: 'היום בלו"ז', body: lines.join('\n'), tag: 'luz-today', sticky: false };
  } catch (e) {}
  return generic;
}
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    const n = await pushContent();
    await self.registration.showNotification(n.title, {
      body: n.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: n.tag, renotify: true,
      requireInteraction: n.sticky, vibrate: [200, 100, 200], dir: 'rtl', lang: 'he'
    });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { c.postMessage({ type: 'refresh' }); return c.focus(); } }
    return self.clients.openWindow(self.registration.scope);
  })());
});
