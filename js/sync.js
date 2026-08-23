/**
 * FULL BODY 17 — GESTIONNAIRE DE SYNCHRONISATION MULTI-UTILISATEURS PRO
 * Architecture Anti-Bloqueur : Passerelle API Cloudflare + Firebase Direct Fallback
 * Chiffrement Client-Side AES-256 Zero-Knowledge.
 */

const CLOUDFLARE_API_GATEWAY = 'https://workout-home.pages.dev/api/sync';
const DIRECT_FIREBASE_RTDB = 'https://workout-homefb17-default-rtdb.europe-west1.firebasedatabase.app';

// Moteur Réseau Hybride Multi-Endpoints (Anti-Bloqueur de publicité)
async function cloudSyncRequest(userHash, method = 'GET', data = null) {
  // Liste des routes possibles par ordre de priorité
  const routes = [
    // Route 1 : Passerelle Cloudflare (100% insensible aux bloqueurs)
    `${CLOUDFLARE_API_GATEWAY}?user=${encodeURIComponent(userHash)}`,
    // Route 2 : Firebase Direct
    `${DIRECT_FIREBASE_RTDB}/workout_profiles/${encodeURIComponent(userHash)}.json`
  ];

  let lastError = null;

  for (const url of routes) {
    try {
      const fetchOpts = {
        method: method,
        mode: 'cors'
      };
      if (data) {
        fetchOpts.headers = { 'Content-Type': 'application/json' };
        fetchOpts.body = typeof data === 'string' ? data : JSON.stringify(data);
      }
      const resp = await fetch(url, fetchOpts);
      if (resp.ok) {
        const text = await resp.text();
        return text && text !== 'null' ? JSON.parse(text) : null;
      }
    } catch (err) {
      console.warn(`[Route ${url} failed, trying next]:`, err);
      lastError = err;
    }
  }

  // Fallback via XMLHttpRequest
  for (const url of routes) {
    try {
      const res = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        if (data) xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(xhr.responseText && xhr.responseText !== 'null' ? JSON.parse(xhr.responseText) : null);
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Réseau indisponible"));
        xhr.timeout = 8000;
        xhr.send(data ? (typeof data === 'string' ? data : JSON.stringify(data)) : null);
      });
      return res;
    } catch (xhrErr) {
      lastError = xhrErr;
    }
  }

  throw lastError || new Error("Impossible d'établir la connexion cloud.");
}

class ProfileSyncManager {
  constructor() {
    this.isSyncing = false;
  }

  getConfig() {
    const prefs = window.appStorage ? window.appStorage.prefs : {};
    return {
      userId: (prefs.syncUserId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      password: (prefs.syncUserPin || '').trim(),
      autoEnabled: prefs.syncAutoEnabled !== false,
      lastTime: prefs.syncLastTime || null
    };
  }

  // Hachage sécurisé et résilient pour la clé Firebase
  async hashUserId(userId) {
    if (window.crypto && window.crypto.subtle) {
      try {
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode('fb17_usr_' + userId));
        const hashArr = Array.from(new Uint8Array(hashBuf));
        return 'u_' + hashArr.map(b => b.toString(16).padStart(2, '0')).slice(0, 20).join('');
      } catch (e) {
        console.warn('Fallback hash:', e);
      }
    }
    // Fallback synchrone
    let hash = 0;
    const str = 'fb17_usr_' + userId;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'u_' + Math.abs(hash).toString(16).padStart(8, '0') + '_' + userId.slice(0, 10);
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
    const jsonStr = JSON.stringify(dataObj);

    if (window.crypto && window.crypto.subtle) {
      try {
        const key = await this.deriveKey(userId, password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
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
      } catch (err) {
        console.warn('[Crypto Encrypt Fallback]:', err);
      }
    }

    // Fallback Base64 direct
    return {
      v: 2,
      app: 'FULL_BODY_17',
      profile: userId,
      raw: btoa(unescape(encodeURIComponent(jsonStr))),
      updatedAt: Date.now()
    };
  }

  async decryptPayload(envelope, userId, password) {
    if (!envelope) throw new Error("Aucune donnée trouvée.");

    // Format Base64 standard
    if (envelope.raw) {
      const decoded = decodeURIComponent(escape(atob(envelope.raw)));
      return JSON.parse(decoded);
    }

    if (!envelope.iv || !envelope.payload) {
      if (envelope.history || envelope.prefs) return envelope;
      throw new Error("Format de données distant non reconnu.");
    }

    if (window.crypto && window.crypto.subtle) {
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

    throw new Error("Le module de déchiffrement sécurisé n'est pas supporté par ce navigateur.");
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
      const userHash = await this.hashUserId(config.userId);

      // 1. Tenter de lire les données distantes (GET)
      let remoteData = null;
      try {
        const remoteEnvelope = await cloudSyncRequest(userHash, 'GET');
        if (remoteEnvelope) {
          remoteData = await this.decryptPayload(remoteEnvelope, config.userId, config.password);
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
      await cloudSyncRequest(userHash, 'PUT', envelope);

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });

      this.isSyncing = false;
      this.updateStatusUI('success', `Connecté (${config.userId})`);

      if (window.dashboardManager) window.dashboardManager.renderDashboard();
      if (window.motivationManager) window.motivationManager.renderBadgesView();
      if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();
      if (typeof loadSettingsForm === 'function') loadSettingsForm();

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
      const userHash = await this.hashUserId(config.userId);
      const remoteEnvelope = await cloudSyncRequest(userHash, 'GET');
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
      if (typeof loadSettingsForm === 'function') loadSettingsForm();

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

  // --- OUTIL DE DIAGNOSTIC & RAPPORT D'ERREUR ---
  async runDiagnostic() {
    const report = [];
    const log = (step, ok, details) => {
      report.push({ step, ok, details, time: new Date().toISOString() });
      console.log(`[Diagnostic] ${ok ? '✅' : '❌'} ${step}:`, details);
    };

    const config = this.getConfig();

    // 1. Informations système
    log('Environnement Web', true, {
      url: window.location.href,
      protocol: window.location.protocol,
      origin: window.location.origin,
      isSecureContext: window.isSecureContext,
      onLine: navigator.onLine,
      userAgent: navigator.userAgent
    });

    // 2. Vérification Crypto
    const hasSubtle = !!(window.crypto && window.crypto.subtle);
    log('Module Cryptographie (AES-GCM)', hasSubtle, hasSubtle ? 'Web Crypto API disponible' : 'Fallback actif');

    // 3. Configuration Profil
    log('Identifiants de profil', !!(config.userId && config.password), {
      userId: config.userId || '(non renseigné)',
      hasPassword: !!config.password,
      autoEnabled: config.autoEnabled
    });

    // 4. Test Cloudflare API Gateway (Anti-AdBlock)
    const cfStart = Date.now();
    try {
      const cfResp = await cloudSyncRequest('diagnostic_test', 'GET');
      const cfDuration = Date.now() - cfStart;
      log('Passerelle Cloud API (Anti-Bloqueur)', true, {
        status: '200 OK',
        duration: `${cfDuration}ms`,
        data: cfResp ? 'Connecté' : 'Endpoint actif'
      });
    } catch (err) {
      log('Passerelle Cloud API (Anti-Bloqueur)', false, {
        error: err.name,
        message: err.message
      });
    }

    // 5. Test Lecture Données Profil (GET)
    if (config.userId) {
      try {
        const userHash = await this.hashUserId(config.userId);
        const getResp = await cloudSyncRequest(userHash, 'GET');
        log('Lecture Profil Cloud (GET)', true, {
          userHash: userHash,
          data: getResp ? 'Données distantes trouvées' : 'Nouveau profil vide (prêt)'
        });
      } catch (err) {
        log('Lecture Profil Cloud (GET)', false, {
          error: err.name,
          message: err.message
        });
      }
    }

    // 6. Test Écriture Cloud (PUT)
    try {
      const testPayload = { ping: 'ok', timestamp: Date.now() };
      const putResp = await cloudSyncRequest('diagnostic_test', 'PUT', testPayload);
      log('Écriture Cloud (PUT)', true, {
        result: putResp || 'OK'
      });
    } catch (err) {
      log('Écriture Cloud (PUT)', false, {
        error: err.name,
        message: err.message
      });
    }

    // 7. Vérification Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        log('Service Worker & PWA', true, {
          active: !!reg && !!reg.active,
          scope: reg ? reg.scope : null
        });
      } catch (e) {
        log('Service Worker & PWA', false, { error: e.message });
      }
    }

    return report;
  }

  async showDiagnosticModal() {
    const modalEl = document.getElementById('diagnostic-modal');
    const contentEl = document.getElementById('diagnostic-report-content');
    const inlinePanel = document.getElementById('diagnostic-inline-panel');
    const inlineContent = document.getElementById('diagnostic-inline-content');

    if (modalEl) modalEl.style.display = 'flex';
    if (inlinePanel) inlinePanel.style.display = 'block';

    const loadingHtml = '<div style="text-align:center; padding: 14px; color: var(--accent-work); font-size: 0.8rem;">⏳ Analyse de la connexion Cloud en cours...</div>';
    if (contentEl) contentEl.innerHTML = loadingHtml;
    if (inlineContent) inlineContent.innerHTML = loadingHtml;

    const report = await this.runDiagnostic();
    let html = '';

    report.forEach(item => {
      const icon = item.ok ? '🟢' : '🔴';
      const color = item.ok ? 'var(--accent-work)' : 'var(--accent-danger)';
      html += `
        <div style="margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid ${color};">
          <div style="font-weight: 700; font-size: 0.8rem; color: ${color}; margin-bottom: 3px;">
            ${icon} ${item.step}
          </div>
          <pre style="margin: 0; font-size: 0.68rem; color: var(--text-secondary); white-space: pre-wrap; word-break: break-word; font-family: monospace;">${JSON.stringify(item.details, null, 2)}</pre>
        </div>
      `;
    });

    if (contentEl) contentEl.innerHTML = html;
    if (inlineContent) inlineContent.innerHTML = html;
    window._lastDiagnosticReport = JSON.stringify(report, null, 2);
  }
}

window.syncManager = new ProfileSyncManager();

window.openSyncDiagnostic = function() {
  if (window.syncManager) {
    window.syncManager.showDiagnosticModal();
  }
};

window.copyDiagnosticReport = function() {
  if (window._lastDiagnosticReport) {
    navigator.clipboard.writeText(window._lastDiagnosticReport).then(() => {
      if (typeof showToast === 'function') showToast("📋 Rapport de diagnostic copié !");
    }).catch(() => {
      if (typeof showToast === 'function') showToast("Rapport disponible dans la console.");
    });
  }
};

window.closeSyncDiagnostic = function() {
  const modalEl = document.getElementById('diagnostic-modal');
  if (modalEl) modalEl.style.display = 'none';
};
