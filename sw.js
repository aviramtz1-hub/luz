// service worker מינימלי: מאפשר התקנה כאפליקציה. תמיד מביא מהרשת (בלי מטמון), כדי שעדכונים יופיעו מיד.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => { /* network only */ });
