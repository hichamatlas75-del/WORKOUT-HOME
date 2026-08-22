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
        installBtn.style.display = 'none';
      } else {
        // Toujours afficher le bouton dans les réglages sur mobile
        installBtn.style.display = 'flex';
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
      alert("📱 Pour installer sur iPhone / iPad :\n\n1. Appuyez sur le bouton 'Partager' (carré avec flèche vers le haut ⬆️ en bas de Safari).\n2. Faites défiler et choisissez 'Sur l'écran d'accueil' ➕.\n3. Cliquez sur 'Ajouter'.");
    } else {
      alert("📱 Pour installer sur Android / Chrome :\n\n1. Appuyez sur les 3 points verticaux ⋮ en haut à droite du navigateur.\n2. Choisissez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
    }
  }
}

window.pwaManager = new PWAManager();
