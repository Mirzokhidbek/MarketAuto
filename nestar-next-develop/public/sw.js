/*
 * The old worker address. The real worker is /service-worker.js now; the one that used to live here served built
 * JS cache-first, so on a dev server (same file names, new code) the browser kept running old code.
 * Browsers that still have it pick this file up as an update: it clears the caches, removes itself and reloads
 * the open tabs once. Keep this file so those browsers clean themselves up.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
			.then(() => self.registration.unregister())
			.then(() => self.clients.matchAll({ type: 'window' }))
			.then((clients) => clients.forEach((client) => client.navigate(client.url))),
	);
});
