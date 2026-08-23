/**
 * FULL BODY 17 — GESTIONNAIRE DE SYNCHRONISATION FIREBASE REALTIME DATABASE PRO (PC ⇄ MOBILE)
 * Chiffrement AES-GCM 256-bit (Zero-Knowledge) & Synchronisation Cloud Firebase.
 */

class FirebaseSyncManager {
  constructor() {
    this.isSyncing = false;
  }

  getConfig() {
    const prefs = window.appStorage ? window.appStorage.prefs : {};
    let url = (prefs.firebaseUrl || '').trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return {
      url: url,
      authToken: (prefs.firebaseAuthToken || '').trim(),
      userId: (prefs.syncUserId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      pin: (prefs.syncUserPin || '').trim(),
      autoEnabled: prefs.syncAutoEnabled !== false,
      lastTime: prefs.syncLastTime || null
    };
  }

  getEndpointUrl() {
    const config = this.getConfig();
    if (!config.url || !config.userId) return null;
    let endpoint = `${config.url}/workout_users/${config.userId}.json`;
    if (config.authToken) {
      endpoint += `?auth=${encodeURIComponent(config.authToken)}`;
    }
    return endpoint;
  }

  // --- CRYPTOGRAPHIE ZERO-KNOWLEDGE (AES-GCM Web Crypto) ---
  async deriveKey(userId, pin, salt = 'fb17_firebase_salt_v2') {
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

  async encryptPayload(dataObj, userId, pin) {
    if (!pin) {
      return {
        v: 2,
        app: 'FULL_BODY_17',
        encrypted: false,
        data: dataObj,
        updatedAt: Date.now()
      };
    }

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
      encrypted: true,
      iv: ivHex,
      payload: payloadHex,
      updatedAt: Date.now()
    };
  }

  async decryptPayload(envelope, userId, pin) {
    if (!envelope) throw new Error("Données distantes vides.");
    if (envelope.encrypted === false && envelope.data) {
      return envelope.data;
    }
    if (!envelope.iv || !envelope.payload) {
      if (envelope.history || envelope.prefs) return envelope;
      throw new Error("Format de données Firebase invalide.");
    }
    if (!pin) {
      throw new Error("Ces données sont chiffrées : votre code PIN est requis pour les déverrouiller.");
    }

    const key = await this.deriveKey(userId, pin);
    const iv = new Uint8Array(envelope.iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ciphertext = new Uint8Array(envelope.payload.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    const decryptedStr = new TextDecoder().decode(decrypted);
    return JSON.parse(decryptedStr);
  }

  // --- ACTIONS DE SYNCHRONISATION ---
  async sync(options = {}) {
    const { silent = false } = options;
    const config = this.getConfig();

    if (!config.url) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Veuillez renseigner l'URL de votre base Firebase dans les Réglages.", true);
      }
      this.updateStatusUI('error', 'URL Firebase requise');
      return false;
    }

    if (!config.userId) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Veuillez renseigner votre Identifiant de synchronisation.", true);
      }
      this.updateStatusUI('error', 'Identifiant requis');
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.updateStatusUI('syncing', 'Synchronisation Firebase...');

    try {
      const endpoint = this.getEndpointUrl();

      // 1. Tenter de lire les données distantes sur Firebase (GET)
      let remoteData = null;
      try {
        const getResp = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });

        if (getResp.ok) {
          const remoteEnvelope = await getResp.json();
          if (remoteEnvelope) {
            remoteData = await this.decryptPayload(remoteEnvelope, config.userId, config.pin);
          }
        }
      } catch (err) {
        console.warn('[Firebase GET]:', err);
        if (err.message && err.message.includes('decrypt')) {
          throw new Error("Code PIN incorrect pour ces données Firebase.");
        }
      }

      // 2. Fusionner avec les données locales
      if (remoteData) {
        window.appStorage.mergeData(remoteData);
      }

      // 3. Préparer le paquet complet
      const fullLocalData = {
        app: 'FULL_BODY_17',
        version: '2.0.0',
        syncedAt: Date.now(),
        prefs: window.appStorage.prefs,
        history: window.appStorage.history,
        badges: window.appStorage.badges,
        weightHistory: window.appStorage.weightHistory
      };

      // 4. Chiffrer et envoyer sur Firebase (PUT)
      const envelope = await this.encryptPayload(fullLocalData, config.userId, config.pin);
      const putResp = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope)
      });

      if (!putResp.ok) {
        if (putResp.status === 401 || putResp.status === 403) {
          throw new Error("Accès refusé par les règles Firebase (.read/.write).");
        }
        throw new Error(`Erreur Firebase (${putResp.status} ${putResp.statusText})`);
      }

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.isSyncing = false;
      this.updateStatusUI('success', `Synchronisé (${nowStr})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      if (!silent && typeof showToast === 'function') {
        showToast("🔥 Synchronisation Firebase réussie !");
      }
      return true;

    } catch (error) {
      console.error('[Firebase Sync Error]:', error);
      this.isSyncing = false;
      const msg = error.message || "Erreur Firebase";
      this.updateStatusUI('error', msg);
      if (!silent && typeof showToast === 'function') {
        showToast(`❌ Échec Firebase : ${msg}`, true);
      }
      return false;
    }
  }

  async pullFromFirebase() {
    const config = this.getConfig();
    if (!config.url || !config.userId) {
      showToast("⚠️ URL Firebase et Identifiant requis.", true);
      return;
    }

    this.updateStatusUI('syncing', 'Téléchargement Firebase...');
    try {
      const endpoint = this.getEndpointUrl();
      const getResp = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!getResp.ok) {
        if (getResp.status === 401 || getResp.status === 403) {
          throw new Error("Accès refusé par les règles Firebase.");
        }
        throw new Error(`Erreur Firebase (${getResp.status})`);
      }

      const remoteEnvelope = await getResp.json();
      if (!remoteEnvelope) {
        throw new Error("Aucune sauvegarde trouvée sur Firebase pour cet identifiant.");
      }

      const remoteData = await this.decryptPayload(remoteEnvelope, config.userId, config.pin);
      const hasChanges = window.appStorage.mergeData(remoteData);
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.updateStatusUI('success', `Données à jour (${nowStr})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      showToast(hasChanges ? "🔥 Données Firebase récupérées avec succès !" : "🔥 Vos données étaient déjà à jour.");
    } catch (err) {
      console.error('[Firebase Pull Error]:', err);
      const msg = err.message || "Erreur récupération";
      this.updateStatusUI('error', msg);
      showToast(`❌ ${msg}`, true);
    }
  }

  autoPush() {
    const config = this.getConfig();
    if (config.url && config.userId && config.autoEnabled) {
      this.sync({ silent: true });
    }
  }

  updateStatusUI(state = null, message = null) {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    const lastTimeEl = document.getElementById('sync-last-time');
    const config = this.getConfig();

    if (!dot || !text) return;

    dot.className = 'sync-dot';

    if (!config.url || !config.userId) {
      dot.classList.add('idle');
      text.textContent = 'Firebase non configuré';
      if (lastTimeEl) lastTimeEl.textContent = "Entrez l'URL de votre base Firebase";
      return;
    }

    if (state === 'syncing') {
      dot.classList.add('syncing');
      text.textContent = message || 'Synchronisation...';
    } else if (state === 'success') {
      dot.classList.add('success');
      text.textContent = message || 'Firebase Connecté';
      if (lastTimeEl && config.lastTime) {
        lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      }
    } else if (state === 'error') {
      dot.classList.add('error');
      text.textContent = message || 'Erreur Firebase';
    } else {
      if (config.lastTime) {
        dot.classList.add('success');
        text.textContent = 'Firebase Connecté';
        if (lastTimeEl) lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      } else {
        dot.classList.add('idle');
        text.textContent = 'Prêt pour 1ère synchro';
        if (lastTimeEl) lastTimeEl.textContent = 'Cliquez sur Synchroniser';
      }
    }
  }
}

window.syncManager = new FirebaseSyncManager();
