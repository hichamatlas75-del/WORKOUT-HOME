/**
 * FULL BODY 17 — GESTIONNAIRE DE SYNCHRONISATION MULTI-UTILISATEURS PRO
 * Connexion transparente par Nom de Profil + Mot de Passe avec Chiffrement AES-256.
 */

const DEFAULT_FIREBASE_RTDB = 'https://workout-home-fb17-default-rtdb.firebaseio.com';

class ProfileSyncManager {
  constructor() {
    this.isSyncing = false;
  }

  getConfig() {
    const prefs = window.appStorage ? window.appStorage.prefs : {};
    let customUrl = (prefs.firebaseUrl || '').trim();
    if (customUrl && !customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
      customUrl = 'https://' + customUrl;
    }
    if (customUrl.endsWith('/')) {
      customUrl = customUrl.slice(0, -1);
    }

    const activeUrl = customUrl || DEFAULT_FIREBASE_RTDB;

    return {
      url: activeUrl,
      userId: (prefs.syncUserId || '').trim().toLowerCase(),
      password: (prefs.syncUserPin || '').trim(),
      autoEnabled: prefs.syncAutoEnabled !== false,
      lastTime: prefs.syncLastTime || null
    };
  }

  // Hachage sécurisé de l'identifiant pour la clé Firebase
  async hashUserId(userId) {
    const enc = new TextEncoder();
    const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode('fb17_usr_' + userId));
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return 'u_' + hashArr.map(b => b.toString(16).padStart(2, '0')).slice(0, 20).join('');
  }

  async getEndpointUrl() {
    const config = this.getConfig();
    if (!config.userId) return null;
    const userHash = await this.hashUserId(config.userId);
    return `${config.url}/workout_profiles/${userHash}.json`;
  }

  // --- CRYPTOGRAPHIE ZERO-KNOWLEDGE (AES-GCM Web Crypto) ---
  async deriveKey(userId, password) {
    const enc = new TextEncoder();
    const secret = `${userId.toLowerCase().trim()}:${password}`;
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
        salt: enc.encode('fb17_profile_salt_v3'),
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async encryptPayload(dataObj, userId, password) {
    const key = await this.deriveKey(userId, password);
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
      v: 3,
      app: 'FULL_BODY_17',
      profile: userId,
      iv: ivHex,
      payload: payloadHex,
      updatedAt: Date.now()
    };
  }

  async decryptPayload(envelope, userId, password) {
    if (!envelope) throw new Error("Aucune donnée trouvée.");
    if (!envelope.iv || !envelope.payload) {
      if (envelope.history || envelope.prefs) return envelope;
      throw new Error("Format de données invalide.");
    }

    const key = await this.deriveKey(userId, password);
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

    if (!config.userId || !config.password) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Renseignez votre Nom de Profil et Mot de passe.", true);
      }
      this.updateStatusUI('error', 'Profil & Mot de passe requis');
      return false;
    }

    if (config.password.length < 3) {
      if (!silent && typeof showToast === 'function') {
        showToast("⚠️ Le mot de passe doit comporter au moins 3 caractères.", true);
      }
      this.updateStatusUI('error', 'Mot de passe trop court');
      return false;
    }

    if (this.isSyncing) return false;
    this.isSyncing = true;
    this.updateStatusUI('syncing', 'Synchronisation en cours...');

    try {
      const endpoint = await this.getEndpointUrl();

      // 1. Tenter de lire les données distantes (GET)
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
            remoteData = await this.decryptPayload(remoteEnvelope, config.userId, config.password);
          }
        }
      } catch (err) {
        console.warn('[Sync GET]:', err);
        if (err.name === 'OperationError' || (err.message && err.message.includes('decrypt'))) {
          throw new Error("Mot de passe incorrect pour ce profil.");
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

      // 4. Chiffrer et envoyer au Cloud (PUT)
      const envelope = await this.encryptPayload(fullLocalData, config.userId, config.password);
      const putResp = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(envelope)
      });

      if (!putResp.ok) {
        throw new Error(`Erreur serveur (${putResp.status})`);
      }

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.isSyncing = false;
      this.updateStatusUI('success', `Connecté (${config.userId})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      if (!silent && typeof showToast === 'function') {
        showToast(`🎉 Profil « ${config.userId} » synchronisé avec succès !`);
      }
      return true;

    } catch (error) {
      console.error('[Sync Error]:', error);
      this.isSyncing = false;
      const msg = error.message || "Erreur de connexion";
      this.updateStatusUI('error', msg);
      if (!silent && typeof showToast === 'function') {
        showToast(`❌ ${msg}`, true);
      }
      return false;
    }
  }

  async pullFromCloud() {
    const config = this.getConfig();
    if (!config.userId || !config.password) {
      showToast("⚠️ Renseignez votre Nom de Profil et Mot de passe.", true);
      return;
    }

    this.updateStatusUI('syncing', 'Téléchargement de vos données...');
    try {
      const endpoint = await this.getEndpointUrl();
      const getResp = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!getResp.ok) {
        throw new Error(`Erreur serveur (${getResp.status})`);
      }

      const remoteEnvelope = await getResp.json();
      if (!remoteEnvelope) {
        throw new Error("Aucune sauvegarde trouvée pour ce profil.");
      }

      const remoteData = await this.decryptPayload(remoteEnvelope, config.userId, config.password);
      const hasChanges = window.appStorage.mergeData(remoteData);
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.updateStatusUI('success', `Connecté (${config.userId})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

      showToast(hasChanges ? "✅ Données de votre profil récupérées avec succès !" : "✅ Vos données étaient déjà à jour.");
    } catch (err) {
      console.error('[Pull Error]:', err);
      const msg = (err.name === 'OperationError' || (err.message && err.message.includes('decrypt')))
        ? "Mot de passe incorrect pour ce profil."
        : (err.message || "Erreur de récupération");
      this.updateStatusUI('error', msg);
      showToast(`❌ ${msg}`, true);
    }
  }

  autoPush() {
    const config = this.getConfig();
    if (config.userId && config.password && config.autoEnabled) {
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

    if (!config.userId || !config.password) {
      dot.classList.add('idle');
      text.textContent = 'Non connecté';
      if (lastTimeEl) lastTimeEl.textContent = 'Entrez un Nom de Profil et un Mot de passe';
      return;
    }

    if (state === 'syncing') {
      dot.classList.add('syncing');
      text.textContent = message || 'Synchronisation...';
    } else if (state === 'success') {
      dot.classList.add('success');
      text.textContent = message || `Connecté (${config.userId})`;
      if (lastTimeEl && config.lastTime) {
        lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      }
    } else if (state === 'error') {
      dot.classList.add('error');
      text.textContent = message || 'Erreur connexion';
    } else {
      if (config.lastTime) {
        dot.classList.add('success');
        text.textContent = `Connecté (${config.userId})`;
        if (lastTimeEl) lastTimeEl.textContent = `Dernière synchro : Aujourd'hui à ${config.lastTime}`;
      } else {
        dot.classList.add('idle');
        text.textContent = `Profil prêt (${config.userId})`;
        if (lastTimeEl) lastTimeEl.textContent = 'Cliquez sur Se Connecter / Synchroniser';
      }
    }
  }
}

window.syncManager = new ProfileSyncManager();
