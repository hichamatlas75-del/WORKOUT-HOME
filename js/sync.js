/**
 * FULL BODY 17 — GESTIONNAIRE DE SYNCHRONISATION CLOUD PRO (PC ⇄ MOBILE)
 * Chiffrement de bout en bout AES-GCM 256-bit (Zero-Knowledge) & Synchronisation Cloud.
 */

class CloudSyncManager {
  constructor() {
    this.apiEndpoint = 'https://kvdb.io/A4tq8Yv3kX1mN9jB7wP2L6/';
    this.isSyncing = false;
  }

  // Obtenir la configuration actuelle
  getConfig() {
    const prefs = window.appStorage.prefs;
    return {
      userId: (prefs.syncUserId || '').trim().toLowerCase(),
      pin: (prefs.syncUserPin || '').trim(),
      autoEnabled: prefs.syncAutoEnabled !== false,
      lastTime: prefs.syncLastTime || null
    };
  }

  // Sauvegarder la configuration
  saveConfig(userId, pin, autoEnabled) {
    window.appStorage.savePreferences({
      syncUserId: (userId || '').trim().toLowerCase(),
      syncUserPin: (pin || '').trim(),
      syncAutoEnabled: !!autoEnabled
    });
    this.updateStatusUI();
  }

  // --- CRYPTOGRAPHIE ZERO-KNOWLEDGE (Web Crypto API AES-GCM) ---
  async deriveKey(userId, pin, salt = 'fb17_pbkdf2_salt_v2') {
    const enc = new TextEncoder();
    const secret = `${userId}:${pin}`;
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async hashStorageKey(userId) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode('fb17_cloud_bucket_' + userId));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'fb17_' + hashArray.map(b => b.toString(16).padStart(2, '0')).slice(0, 24).join('');
  }

  async encryptPayload(dataObj, userId, pin) {
    const key = await this.deriveKey(userId, pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const jsonStr = JSON.stringify(dataObj);
    const encodedData = new TextEncoder().encode(jsonStr);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedData
    );

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const payloadHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');

    return {
      v: 2,
      app: 'FULL_BODY_17',
      iv: ivHex,
      payload: payloadHex,
      updatedAt: Date.now()
    };
  }

  async decryptPayload(encryptedObj, userId, pin) {
    if (!encryptedObj || !encryptedObj.iv || !encryptedObj.payload) {
      throw new Error("Format de données chiffrées invalide.");
    }

    const key = await this.deriveKey(userId, pin);
    const iv = new Uint8Array(encryptedObj.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(encryptedObj.payload.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decryptedStr = new TextDecoder().decode(decrypted);
    return JSON.parse(decryptedStr);
  }

  // --- ACTIONS DE SYNCHRONISATION ---

  /**
   * Synchronisation complète (Pull + Merge + Push).
   */
  async sync(options = {}) {
    const { silent = false } = options;
    const config = this.getConfig();

    if (!config.userId || !config.pin) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Renseignez votre Identifiant et code PIN pour synchroniser.", true);
      }
      this.updateStatusUI('error', 'Identifiant et PIN requis');
      return false;
    }

    if (config.pin.length < 4) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Le code PIN doit comporter au moins 4 caractères.", true);
      }
      this.updateStatusUI('error', 'PIN trop court (min 4 car.)');
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.updateStatusUI('syncing', 'Synchronisation en cours...');

    try {
      const storageKey = await this.hashStorageKey(config.userId);
      const url = this.apiEndpoint + storageKey;

      // 1. Tenter de récupérer les données distantes (Pull)
      let remoteData = null;
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (response.ok) {
          const rawText = await response.text();
          if (rawText && rawText.trim().startsWith('{')) {
            const encryptedEnvelope = JSON.parse(rawText);
            remoteData = await this.decryptPayload(encryptedEnvelope, config.userId, config.pin);
          }
        }
      } catch (err) {
        console.warn('[Sync] Note pull:', err);
        // Si erreur de déchiffrement -> mauvais PIN !
        if (err.name === 'OperationError' || (err.message && err.message.includes('decrypt'))) {
          throw new Error("Code PIN incorrect pour cet identifiant.");
        }
      }

      // 2. Fusionner les données locales et distantes
      if (remoteData) {
        window.appStorage.mergeData(remoteData);
      }

      // 3. Préparer le paquet complet local fusionné
      const fullLocalData = {
        app: 'FULL_BODY_17',
        version: '2.0.0',
        syncedAt: Date.now(),
        prefs: window.appStorage.prefs,
        history: window.appStorage.history,
        badges: window.appStorage.badges,
        weightHistory: window.appStorage.weightHistory
      };

      // 4. Chiffrer et envoyer au Cloud (Push)
      const encryptedPackage = await this.encryptPayload(fullLocalData, config.userId, config.pin);
      const pushResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encryptedPackage)
      });

      if (!pushResponse.ok) {
        throw new Error(`Erreur serveur Cloud (${pushResponse.status})`);
      }

      // 5. Mettre à jour l'horodatage de dernière synchronisation
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.isSyncing = false;
      this.updateStatusUI('success', `Synchronisé (${nowStr})`);

      // Rafraîchir l'interface
      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      if (!silent && typeof showToast === 'function') {
        showToast("☁️ Synchronisation PC ⇄ Mobile réussie !");
      }
      return true;

    } catch (error) {
      console.error('[Sync] Erreur:', error);
      this.isSyncing = false;
      const errorMsg = error.message || "Erreur de connexion";
      this.updateStatusUI('error', errorMsg);

      if (!silent && typeof showToast === 'function') {
        showToast(`❌ Échec synchronisation : ${errorMsg}`, true);
      }
      return false;
    }
  }

  /**
   * Récupération seule depuis le Cloud (Pull).
   */
  async pullFromCloud() {
    const config = this.getConfig();
    if (!config.userId || !config.pin) {
      if (typeof showToast === 'function') showToast("⚠️ Renseignez votre Identifiant et PIN.", true);
      return;
    }

    this.updateStatusUI('syncing', 'Téléchargement depuis le Cloud...');
    try {
      const storageKey = await this.hashStorageKey(config.userId);
      const url = this.apiEndpoint + storageKey;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error("Aucune sauvegarde trouvée sur le Cloud pour cet identifiant.");
      }

      const rawText = await response.text();
      const encryptedEnvelope = JSON.parse(rawText);
      const remoteData = await this.decryptPayload(encryptedEnvelope, config.userId, config.pin);

      const hasChanges = window.appStorage.mergeData(remoteData);
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.updateStatusUI('success', `Données à jour (${nowStr})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      if (typeof showToast === 'function') {
        showToast(hasChanges ? "✅ Données Cloud récupérées avec succès !" : "✅ Vos données étaient déjà à jour.");
      }
    } catch (err) {
      console.error('[Sync Pull] Erreur:', err);
      const msg = err.message && err.message.includes('decrypt') ? "Code PIN incorrect." : err.message;
      this.updateStatusUI('error', msg);
      if (typeof showToast === 'function') showToast(`❌ ${msg}`, true);
    }
  }

  /**
   * Synchronisation automatique silencieuse en arrière-plan (après séance / pesée).
   */
  autoPush() {
    const config = this.getConfig();
    if (config.userId && config.pin && config.autoEnabled) {
      this.sync({ silent: true });
    }
  }

  // Mise à jour visuelle de la carte de statut
  updateStatusUI(state = null, message = null) {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    const lastTimeEl = document.getElementById('sync-last-time');
    const config = this.getConfig();

    if (!dot || !text) return;

    dot.className = 'sync-dot';

    if (!config.userId || !config.pin) {
      dot.classList.add('idle');
      text.textContent = 'Non configuré';
      if (lastTimeEl) lastTimeEl.textContent = 'Entrez un Identifiant et un code PIN';
      return;
    }

    if (state === 'syncing') {
      dot.classList.add('syncing');
      text.textContent = message || 'Synchronisation...';
    } else if (state === 'success') {
      dot.classList.add('success');
      text.textContent = message || 'Synchronisé';
      if (lastTimeEl && config.lastTime) {
        lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      }
    } else if (state === 'error') {
      dot.classList.add('error');
      text.textContent = message || 'Erreur de connexion';
    } else {
      // État initial basé sur la dernière synchro
      if (config.lastTime) {
        dot.classList.add('success');
        text.textContent = `Actif • Connecté`;
        if (lastTimeEl) lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      } else {
        dot.classList.add('idle');
        text.textContent = `Prêt pour 1ère synchro`;
        if (lastTimeEl) lastTimeEl.textContent = `Cliquez sur Synchroniser`;
      }
    }
  }
}

window.syncManager = new CloudSyncManager();
