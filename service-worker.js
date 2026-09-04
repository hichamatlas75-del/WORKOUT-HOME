const CACHE_NAME = 'fullbody17-v2.3.6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/components.css',
  './js/app.js',
  './js/exercises.js',
  './js/workout.js',
  './js/audio.js',
  './js/storage.js',
  './js/dashboard.js',
  './js/motivation.js',
  './js/notifications.js',
  './js/pwa.js',
  './js/motion-player.js',
  './js/sync.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './images/ex_1_jumping_jack.jpg',
  './images/ex_2_squat.jpg',
  './images/ex_3_pushups.jpg',
  './images/ex_4_crunch_scissor.jpg',
  './images/ex_mountain_climbers.jpg',
  './images/ex_5_bridge.jpg',
  './images/ex_6_hip_ext.jpg',
  './images/ex_7_plank.jpg',
  './images/ex_8_stretching.jpg'
];

// État mémoire synchronisé pour les rappels
let reminderState = {
  active: true,
  targetTime: "17:00",
  doneToday: false,
  lastNotifiedDate: null
};

// 1. Installation du Service Worker et mise en cache résiliente des ressources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache des ressources');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url)
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Stratégie Cache-First avec repli réseau
self.addEventListener('fetch', (event) => {
  // Ne JAMAIS intercepter les requêtes vers Firebase ou non-GET
  if (event.request.method !== 'GET' || event.request.url.includes('firebase')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En arrière-plan, tenter de mettre à jour le cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline, pas d'erreur critique */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Si la ressource est introuvable hors ligne et qu'il s'agit d'une page
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// --------------------------------------------------------------------------
// 4. RAPPELS NATIFS PWA HORS-LIGNE & GESTION DES NOTIFICATIONS
// --------------------------------------------------------------------------

// Fonction utilitaire pour afficher une notification riche et interactive
function showRichWorkoutNotification(title, body, customData = {}) {
  const options = {
    body: body || "Votre séance quotidienne de 15 à 20 min vous attend. Prêt ?",
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    image: './images/ex_1_jumping_jack.jpg',
    tag: 'fb17-daily-reminder',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    actions: [
      {
        action: 'start',
        title: '🚀 Démarrer la séance'
      },
      {
        action: 'snooze',
        title: '⏰ Reporter (+15 min)'
      }
    ],
    data: {
      url: './index.html?action=start',
      timestamp: Date.now(),
      ...customData
    }
  };

  return self.registration.showNotification(title || "C'est l'heure de votre Full Body 17 !", options);
}

// Support de l'API Periodic Background Sync (Android/Chrome natif en tâche de fond)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-workout-reminder' || event.tag === 'workout-check') {
    event.waitUntil(
      (async () => {
        const now = new Date();
        const hours = now.getHours();
        // Si entre 16h30 et 21h00 et que la séance n'a pas été faite
        if (hours >= 16 && hours <= 21 && !reminderState.doneToday && reminderState.active) {
          await showRichWorkoutNotification(
            "C'est l'heure de votre Full Body 17 !",
            "🔥 Prenez 15 minutes pour vous aujourd'hui. Maintenez votre série active !"
          );
        }
      })()
    );
  }
});

// Support des notifications Push Web distantes
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data = { body: event.data.text() }; }
  }

  const title = data.title || "Full Body 17 • Rappel d'entraînement";
  const body = data.body || "Votre routine quotidienne est prête !";

  event.waitUntil(showRichWorkoutNotification(title, body, data));
});

// Gestion des interactions & clics sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;

  // Action : Reporter de 15 minutes
  if (action === 'snooze') {
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(async () => {
          await showRichWorkoutNotification(
            "Rappel différé • Full Body 17 ⏰",
            "Les 15 minutes de pause sont écoulées ! C'est le moment de vous lancer."
          );
          resolve();
        }, 15 * 60 * 1000);
      })
    );
    return;
  }

  // Action : Démarrer directement la séance ou clic sur le corps de la notification
  const targetUrl = (action === 'start' || !event.notification.data?.url)
    ? './index.html?action=start'
    : event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la mettre en focus et naviguer
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre PWA
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Communication bidirectionnelle avec l'application (Message Channel)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SYNC_REMINDER_STATE') {
    reminderState = {
      ...reminderState,
      ...event.data.payload
    };
  } else if (event.data.type === 'TRIGGER_TEST_NOTIFICATION') {
    showRichWorkoutNotification(
      "Test Rappel PWA • FULL BODY 17",
      "✅ Vos notifications natives PWA sont actives avec actions rapides et vibration."
    );
  } else if (event.data.type === 'SCHEDULE_SNOOZE') {
    const delayMinutes = event.data.minutes || 15;
    setTimeout(() => {
      showRichWorkoutNotification(
        "Rappel différé • Full Body 17 ⏰",
        "Prêt pour vos 15 minutes de routine Full Body ?"
      );
    }, delayMinutes * 60 * 1000);
  }
});
