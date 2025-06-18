// Define the name of your cache. Increment this version number
// whenever you make changes to files that need to be re-cached.
// Incrementing it to 'v5' will ensure the browser tries to get a fresh cache.
const CACHE_NAME = 'dive-map-v6';

// List of all files that should be cached for offline use.
// Ensure these paths EXACTLY match the file locations in your project folder.

const urlsToCache = [
  './index.html',
  './manifest.json',
  './config.json',
  'images/marker-icon-2x.png',
  'images/marker-icon.png',
  './images/marker-shadow.png',
  './images/ScubaSur.png',
  './images/icon-192x192.png',
  './images/icon-512x512.png',
  './placehold_dc.png',
  // --- IMPORTANT: Add paths to ALL your QR code images here ---
  // Assuming your QR codes are in a folder named 'qrcodes' in the root.
  // You need to explicitly list every single QR code image file.
  'qrcodes/210.png',  //Site:Balitown
	'qrcodes/212.png',  //Site:Hucan Dana
	'./qrcodes/214.png',  //Site:el Percel Dive Site
	'./qrcodes/215.png',  //Site:Dorado Reef
	'./qrcodes/222.png',  //Site:Salobre
	'./qrcodes/223.png',  //Site:Sailboat Deep
	'./qrcodes/224.png',  //Site:Sailboat
	'./qrcodes/226.png',  //Site:Piper Cherokee P32
	'./qrcodes/228.png',  //Site:Pasito Blanco
	'./qrcodes/233.png',  //Site:Mogan Caves
	'./qrcodes/234.png',  //Site:Mogan Wrecks
	'./qrcodes/235.png',  //Site:Meteor
	'./qrcodes/236.png',  //Site:Medio Almud
	'./qrcodes/237.png',  //Site:Media Shallow
	'./qrcodes/239.png',  //Site:Magic 2
	'./qrcodes/244.png',  //Site:Helena Reef
	'./qrcodes/255.png',  //Site:Como Tu
	'./qrcodes/258.png',  //Site:Balito Princess
	'./qrcodes/259.png',  //Site:Balito Deep
	'./qrcodes/260.png',  //Site:Balito - Alexandria
	'./qrcodes/261.png',  //Site:Bahia Lila
	'./qrcodes/262.png',  //Site:Bahia Blanca
	'./qrcodes/264.png',  //Site:Artificial - Raybank
	'./qrcodes/265.png',  //Site:Artificial - Blok3
	'./qrcodes/266.png',  //Site:Artificial - Blok2
	'./qrcodes/267.png',  //Site:Artificial - Blok1
	'./qrcodes/268.png',  //Site:Artificial - Artificial
	'./qrcodes/270.png',  //Site:Arguineguin Reef
	'./qrcodes/290.png',  //Site:Bahia Verde
  // ... continue listing all your QR code images (e.g., '/qrcodes/qr_site1.png', '/qrcodes/qr_site2.png')
];

/// --- Install event: Caches all necessary files ---
self.addEventListener('install', event => {
  console.log('Service Worker: Installing and Caching App Shell');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Service Worker: Caching assets');
      
      console.log('Checking all cache URLs:');
      for (const url of urlsToCache) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          console.log(`[OK] ${url}`);
        } catch (err) {
          console.error(`[FAIL] ${url}`, err);
        }
      }

      // Then try to add all (knowing what might fail)
      try {
        await cache.addAll(urlsToCache);
      } catch (error) {
        console.error('Service Worker: Failed to cache assets during install:', error);
      }
    })()
  );
});

// --- Activate event: Cleans up old caches ---
// This event fires when the service worker becomes active, usually after installation.
// It's crucial for cleaning up old cache versions, ensuring only the latest assets are used.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating and Cleaning up old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // If a cache's name doesn't match the current CACHE_NAME, delete it.
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// --- Fetch event: Serves cached content or fetches from network ---
// This event intercepts every network request the PWA makes.
self.addEventListener('fetch', event => {
  // Only handle GET requests, as other methods (like POST) are typically not cached.
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(response => {
        // If the requested resource is found in the cache, return it immediately.
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // If the resource is not in the cache, attempt to fetch it from the network.
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then(networkResponse => {
          // Check if the network response is valid and cacheable.
          // 'basic' type refers to resources from the same origin or a valid CORS origin.
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse; // If not valid, just return the response without caching.
          }

          // IMPORTANT: Clone the response. A response is a stream and can only be
          // consumed once. We need one copy for the cache and one to return to the browser.
          const responseToCache = networkResponse.clone();

          // Open the current cache and store the fetched response.
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
              console.log('Service Worker: Caching new resource:', event.request.url);
            })
            .catch(error => {
                // Log any errors encountered while trying to cache the new resource.
                console.warn('Service Worker: Failed to cache new resource:', event.request.url, error);
            });

          return networkResponse; // Return the network response to the browser.
        }).catch(error => {
          // This catch block handles cases where the network fetch fails (e.g., offline).
          console.error('Service Worker: Network fetch failed for:', event.request.url, error);
          // If a critical asset (like index.html or main CSS/JS) fails to fetch,
          // the app might not display correctly. For images, they might just appear broken.
          // You could return a predefined offline page or placeholder here if needed.
        });
      })
    );
  }
});
