/**
 * FULL BODY 17 — GESTIONNAIRE DE NOTIFICATIONS & RAPPEL DE 17H00
 * Rappel quotidien automatique pour ancrer la routine de 17h.
 *
 * LIMITATION : Le setInterval JS ne fonctionne que si la PWA est ouverte et active.
 * Pour de vrais rappels en arrière-plan, il faudrait implémenter l'API Web Push
 * avec un serveur (ou utiliser les Background Sync / Periodic Sync APIs lorsqu'elles
 * seront largement supportées).
 */

class NotificationManager {
  constructor() {
    this.intervalId = null;
    this.lastTriggeredDate = null;
  }

  // Demander l'autorisation à l'utilisateur
  async requestPermission() {
    if (!('Notification' in window)) {
      if (typeof showToast === 'function') showToast("Les notifications ne sont pas supportées par votre navigateur.", true);
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Démarrer la surveillance de l'heure cible (ex: 17:00)
  startReminderWatcher() {
    if (this.intervalId) clearInterval(this.intervalId);

    // Vérifier chaque minute
    this.intervalId = setInterval(() => {
      this.checkScheduledTime();
    }, 60000);

    // Première vérification immédiate
    this.checkScheduledTime();
  }

  // Vérification de l'heure programmée
  checkScheduledTime() {
    const prefs = window.appStorage.prefs;
    if (!prefs.reminderActive) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = window.appStorage.formatDateISO(now);

    const targetTime = prefs.targetTime || "17:00";

    // Si l'heure correspond et qu'on n'a pas déjà notifié aujourd'hui
    if (currentTimeStr === targetTime && this.lastTriggeredDate !== todayStr) {
      const streakStats = window.appStorage.getStreakStats();
      if (!streakStats.doneToday) {
        this.sendNotification(
          "C'est l'heure de votre Full Body 17 !",
          "Votre routine quotidienne de 15 à 20 min vous attend. Prêt pour la séance ?"
        );
        this.lastTriggeredDate = todayStr;
      }
    }
  }

  // Envoi effectif de la notification
  sendNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      const options = {
        body: body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'fb17-daily-reminder',
        renotify: true
      };

      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Erreur notification:', e);
    }
  }

  // Test immédiat de notification pour vérifier le bon fonctionnement
  async sendTestNotification() {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      if (typeof showToast === 'function') showToast("Veuillez autoriser les notifications dans les réglages de votre navigateur.", true);
      return;
    }

    this.sendNotification(
      "Test Rappel 17h00 • FULL BODY 17",
      "Notification active ! Votre rappel quotidien retentira chaque jour à l'heure choisie."
    );
  }
}

window.notificationManager = new NotificationManager();
