/*
 * CarPort service worker: makes the site installable (PWA) and keeps it usable on a bad connection.
 *  - pages: network first; without a network the last copy, or the offline page
 *  - built JS/CSS (/_next/static, content-hashed) and images: cache first
 *  - the API, uploads from other hosts and admin pages are never cached
 * Bump VERSION to drop old caches after a change to this file.
 */
const VERSION = 'v1';
const PAGES = `carport-pages-${VERSION}`;
const ASSETS = `carport-assets-${VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(PAGES).then((cache) => cache.addAll([OFFLINE_URL])));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== PAGES && key !== ASSETS).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

const isAsset = (url) =>
	url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/img/') || /\.(woff2?|png|svg|webp|ico)$/.test(url.pathname);
const isPrivate = (url) => /^\/(?:(?:ru|en)\/)?(?:_admin|admin|mypage|account)(?:\/|$)/.test(url.pathname);

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// public pages only: a saved copy of "My Page" must not be shown to the next person on this device
					if (response.ok && !isPrivate(url)) {
						const copy = response.clone();
						caches.open(PAGES).then((cache) => cache.put(request, copy));
					}
					return response;
				})
				.catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
		);
		return;
	}

	if (isAsset(url)) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						if (response.ok) {
							const copy = response.clone();
							caches.open(ASSETS).then((cache) => cache.put(request, copy));
						}
						return response;
					}),
			),
		);
	}
});
