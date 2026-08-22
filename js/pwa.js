/**
 * FULL BODY 17 — INSTALLATEUR PWA & SERVICE WORKER
 * Enregistrement du Service Worker et gestion de l'installation sur écran d'accueil.
 */

let deferredPrompt = null;

class PWAManager {
  constructor() {
    this.initServiceWorker();
    this.initInstallPrompt();
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((registration) => {
            console.log('[PWA] ServiceWorker enregistré avec succès:', registration.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Échec enregistrement ServiceWorker:', err);
          });
      });
    }
  }

  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Empêcher la bannière automatique standard
      e.preventDefault();
      deferredPrompt = e;

      // Afficher le bouton ou bandeau d'installation dans les réglages
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.style.display = 'flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Application installée avec succès !');
      deferredPrompt = null;
      const installBtn = document.getElementById('btn-pwa-install');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
    });
  }

  async promptInstall() {
    if (!deferredPrompt) {
      alert("Pour installer l'application :\n• Sur iOS : appuyez sur le bouton 'Partager' puis 'Sur l'écran d'accueil'.\n• Sur Android / Chrome : utilisez le menu du navigateur puis 'Installer l'application'.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Choix de l'utilisateur: ${outcome}`);
    deferredPrompt = null;
  }
}

window.pwaManager = new PWAManager();
