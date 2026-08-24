/**
 * FULL BODY 17 — GESTIONNAIRE DE NOTIFICATIONS & RAPPELS NATIFS PWA
 * - API Notification standard & ServiceWorker Registration
 * - API Periodic Background Sync (Android/Chrome tâche de fond autonome)
 * - Actions interactives (Démarrer la séance / Reporter de 15 min)
 * - Synchronisation d'état bidirectionnelle avec le Service Worker
 */

class NotificationManager {
  constructor() {
    this.intervalId = null;
    this.lastTriggeredDate = null;
    this.initPeriodicSync();
  }

  // Vérifier et demander l'autorisation native
  async requestPermission() {
    if (!('Notification' in window)) {
      if (typeof showToast === 'function') {
        showToast("Les notifications ne sont pas supportées par votre navigateur.", true);
      }
      return false;
    }

    if (Notification.permission === 'granted') {
      this.syncStateWithServiceWorker();
      this.registerPeriodicSync();
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.syncStateWithServiceWorker();
          this.registerPeriodicSync();
          if (typeof showToast === 'function') {
            showToast("🔔 Notifications PWA autorisées !");
          }
          return true;
        }
      } catch (err) {
        console.warn('Erreur demande permission notifications:', err);
      }
    }

    return false;
  }

  // Enregistrement de l'API Periodic Background Sync (pour réveil en arrière-plan sans onglet ouvert)
  async registerPeriodicSync() {
    if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state === 'granted') {
          await registration.periodicSync.register('daily-workout-reminder', {
            minInterval: 12 * 60 * 60 * 1000 // intervalle minimal recommandé (12h)
          });
          console.log('[PWA Reminder] Periodic Background Sync enregistré avec succès.');
        }
      } catch (err) {
        console.log('[PWA Reminder] Periodic Background Sync non disponible:', err.message);
      }
    }
  }

  // Initialisation au démarrage
  initPeriodicSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          this.registerPeriodicSync();
          this.syncStateWithServiceWorker();
        }
      });
    }
  }

  // Synchronisation des préférences d'heure et statut avec le Service Worker
  syncStateWithServiceWorker() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

    try {
      const prefs = window.appStorage ? window.appStorage.prefs : {};
      const streakStats = window.appStorage ? window.appStorage.getStreakStats() : { doneToday: false };

      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_REMINDER_STATE',
        payload: {
          active: prefs.reminderActive !== false,
          targetTime: prefs.targetTime || "17:00",
          doneToday: streakStats.doneToday
        }
      });
    } catch (e) {
      console.warn('Erreur postMessage SW:', e);
    }
  }

  // Surveillance active de l'heure programmée (au premier plan ou onglet actif)
  startReminderWatcher() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Vérifier chaque minute
    this.intervalId = setInterval(() => {
      this.checkScheduledTime();
    }, 60000);

    // Vérification immédiate
    this.checkScheduledTime();

    // Vérifier également au retour de visibilité de l'application
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkScheduledTime();
        this.syncStateWithServiceWorker();
      }
    });
  }

  // Vérification de l'heure programmée
  checkScheduledTime() {
    const prefs = window.appStorage ? window.appStorage.prefs : {};
    if (!prefs.reminderActive) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = window.appStorage ? window.appStorage.formatDateISO(now) : now.toISOString().split('T')[0];

    const targetTime = prefs.targetTime || "17:00";

    // Si l'heure correspond et qu'on n'a pas déjà notifié aujourd'hui
    if (currentTimeStr === targetTime && this.lastTriggeredDate !== todayStr) {
      const streakStats = window.appStorage ? window.appStorage.getStreakStats() : { doneToday: false };
      if (!streakStats.doneToday) {
        this.sendNotification(
          "C'est l'heure de votre Full Body 17 !",
          "Votre routine quotidienne de 15 à 20 min vous attend. Prêt pour la séance ?"
        );
        this.lastTriggeredDate = todayStr;
      }
    }
  }

  // Envoi effectif de la notification riche et interactive
  sendNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      const options = {
        body: body || "15 à 20 minutes pour maintenir votre forme et votre santé !",
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        image: './images/ex_1_jumping_jack.jpg',
        vibrate: [200, 100, 200, 100, 400],
        tag: 'fb17-daily-reminder',
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'start', title: '🚀 Démarrer la séance' },
          { action: 'snooze', title: '⏰ Reporter (+15 min)' }
        ],
        data: {
          url: './index.html?action=start',
          timestamp: Date.now()
        }
      };

      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        }).catch(() => {
          new Notification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Erreur notification native:', e);
    }
  }

  // Test complet et interactif
  async sendTestNotification() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      if (typeof showToast === 'function') {
        showToast("Veuillez autoriser les notifications dans les réglages du navigateur.", true);
      }
      return;
    }

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_TEST_NOTIFICATION' });
    } else {
      this.sendNotification(
        "Test Rappel PWA • FULL BODY 17",
        "Notification native active avec actions directes (Démarrer / Reporter) et vibration !"
      );
    }

    if (typeof showToast === 'function') {
      showToast("🔔 Notification de test envoyée !");
    }
  }

  // Obtenir le statut textuel de l'autorisation
  getPermissionStatus() {
    if (!('Notification' in window)) return 'Non supporté';
    if (Notification.permission === 'granted') return '✅ Actif & Autorisé';
    if (Notification.permission === 'denied') return '🚫 Bloqué';
    return '⚠️ Non configuré';
  }
}

window.notificationManager = new NotificationManager();
