/**
 * FULL BODY 17 — INSTALLATEUR PWA & SERVICE WORKER
 * Enregistrement du Service Worker et gestion de l'installation sur écran d'accueil.
 */

let deferredPrompt = null;

class PWAManager {
  constructor() {
    this.initServiceWorker();
    this.initInstallPrompt();
    this.checkInstallationStatus();
  }

  initServiceWorker() {
    if ('serviceWorker' in navigator) {
      if (window.location.protocol === 'file:') {
        console.warn('[PWA] Note: Les Service Workers et l\'installation PWA nécessitent HTTPS ou un serveur local (http://localhost). Sur GitHub Pages (https://...), la PWA est 100% active.');
        return;
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((registration) => {
            console.log('[PWA] ServiceWorker actif:', registration.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Erreur ServiceWorker:', err);
          });
      });
    }
  }

  initInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

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
      if (typeof showToast === 'function') {
        showToast('✅ Application installée sur votre écran d\'accueil !');
      }
    });
  }

  checkInstallationStatus() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) {
      if (isStandalone) {
        // Déjà installé : cacher le bouton
        installBtn.style.display = 'none';
      } else if (deferredPrompt) {
        // Android/Chrome : prompt natif disponible
        installBtn.style.display = 'flex';
      } else {
        // iOS Safari ou contexte sans prompt natif : masquer par défaut
        // (le bouton réapparaîtra si beforeinstallprompt se déclenche)
        installBtn.style.display = 'none';
      }
    }
  }

  async promptInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Choix utilisateur: ${outcome}`);
      deferredPrompt = null;
      return;
    }

    // Si le prompt natif n'est pas disponible (iOS Safari ou Chrome sans trigger immédiat)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      if (typeof showToast === 'function') {
        showToast('📱 Safari : appuyez sur Partager ⬆️ puis "Sur l\'écran d\'accueil"');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast('📱 Chrome : menu ⋮ → "Installer l\'application"');
      }
    }
  }
}

window.pwaManager = new PWAManager();
