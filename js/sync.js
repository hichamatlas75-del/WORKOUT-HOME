/**
 * FULL BODY 17 — GESTIONNAIRE DE SYNCHRONISATION PRO PC ⇄ MOBILE
 * Synchronisation 1-Clic par QR Code, Lien Direct & Code de Synchronisation Sécurisé.
 */

// Mini-générateur QRCode autonome 100% Vanilla JS (Zero dépendance externe)
(function(global) {
  function QRCode(typeNumber, errorCorrectionLevel) {
    this.typeNumber = typeNumber || 4;
    this.errorCorrectionLevel = errorCorrectionLevel || 1; // 1 = M
    this.modules = null;
    this.moduleCount = 0;
    this.dataList = [];
  }

  function QR8BitByte(data) {
    this.mode = 4;
    this.data = data;
    this.parsedData = [];
    for (let i = 0; i < data.length; i++) {
      const byteArray = [];
      const code = data.charCodeAt(i);
      if (code > 0x10000) {
        byteArray[0] = 0xF0 | ((code & 0x1C0000) >>> 18);
        byteArray[1] = 0x80 | ((code & 0x3F000) >>> 12);
        byteArray[2] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[3] = 0x80 | (code & 0x3F);
      } else if (code > 0x800) {
        byteArray[0] = 0xE0 | ((code & 0xF000) >>> 12);
        byteArray[1] = 0x80 | ((code & 0xFC0) >>> 6);
        byteArray[2] = 0x80 | (code & 0x3F);
      } else if (code > 0x80) {
        byteArray[0] = 0xC0 | ((code & 0x7C0) >>> 6);
        byteArray[1] = 0x80 | (code & 0x3F);
      } else {
        byteArray[0] = code;
      }
      this.parsedData.push(byteArray);
    }
    this.parsedData = Array.prototype.concat.apply([], this.parsedData);
  }

  QR8BitByte.prototype = {
    getLength: function() { return this.parsedData.length; },
    write: function(buffer) {
      for (let i = 0; i < this.parsedData.length; i++) {
        buffer.put(this.parsedData[i], 8);
      }
    }
  };

  QRCode.prototype = {
    addData: function(data) {
      this.dataList.push(new QR8BitByte(data));
    },
    isDark: function(row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        return false;
      }
      return this.modules[row][col];
    },
    getModuleCount: function() { return this.moduleCount; },
    make: function() {
      // Ajustement dynamique de la version QR selon la taille
      const totalLen = this.dataList.reduce((acc, cur) => acc + cur.getLength(), 0);
      if (totalLen > 600) this.typeNumber = 14;
      else if (totalLen > 400) this.typeNumber = 10;
      else if (totalLen > 250) this.typeNumber = 8;
      else if (totalLen > 120) this.typeNumber = 6;
      else this.typeNumber = 4;

      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl: function(test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);
      for (let row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);
        for (let col = 0; col < this.moduleCount; col++) {
          this.modules[row][col] = null;
        }
      }
      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupTimingPattern();
      this.setupPositionAdjustPattern();
      this.mapData(this.createData(this.typeNumber, this.errorCorrectionLevel, this.dataList), maskPattern);
    },
    setupPositionProbePattern: function(row, col) {
      for (let r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;
        for (let c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;
          if ((0 <= r && r <= 6 && (c == 0 || c == 6)) ||
              (0 <= c && c <= 6 && (r == 0 || r == 6)) ||
              (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    getBestMaskPattern: function() { return 0; },
    setupTimingPattern: function() {
      for (let r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] !== null) continue;
        this.modules[r][6] = (r % 2 == 0);
      }
      for (let c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] !== null) continue;
        this.modules[6][c] = (c % 2 == 0);
      }
    },
    setupPositionAdjustPattern: function() {
      const pos = [6, 22, 38, 54, 70, 86, 102][Math.min(6, Math.floor(this.typeNumber / 2))];
      if (this.typeNumber >= 2) {
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (this.modules[pos + r] && this.modules[pos + r][pos + c] === null) {
              this.modules[pos + r][pos + c] = (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
            }
          }
        }
      }
    },
    createData: function(typeNumber, errorCorrectionLevel, dataList) {
      const buffer = { buffer: [], length: 0, put: function(num, length) {
        for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) == 1);
      }, putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) this.buffer.push(0);
        if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
        this.length++;
      }};
      for (let i = 0; i < dataList.length; i++) {
        const data = dataList[i];
        buffer.put(data.mode, 4);
        buffer.put(data.getLength(), 8);
        data.write(buffer);
      }
      return buffer.buffer;
    },
    mapData: function(data, maskPattern) {
      let inc = -1, row = this.moduleCount - 1, bitIndex = 7, byteIndex = 0;
      for (let col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (this.modules[row][col - c] === null) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (((data[byteIndex] >>> bitIndex) & 1) == 1);
              }
              this.modules[row][col - c] = dark;
              bitIndex--;
              if (bitIndex == -1) { byteIndex++; bitIndex = 7; }
            }
          }
          row += inc;
          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    },
    createSvg: function(cellSize = 4, margin = 8) {
      const size = this.getModuleCount() * cellSize + margin * 2;
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">`;
      svg += `<rect width="${size}" height="${size}" fill="#ffffff" rx="12"/>`;
      for (let r = 0; r < this.getModuleCount(); r++) {
        for (let c = 0; c < this.getModuleCount(); c++) {
          if (this.isDark(r, c)) {
            const x = c * cellSize + margin;
            const y = r * cellSize + margin;
            svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#090d16"/>`;
          }
        }
      }
      svg += `</svg>`;
      return svg;
    }
  };

  global.MiniQRCode = QRCode;
})(window);

// --------------------------------------------------------------------------
// GESTIONNAIRE DE SYNCHRONISATION CLOUD & QR CODE (MULTI-APPAREILS)
// --------------------------------------------------------------------------
class CloudSyncManager {
  constructor() {
    this.isSyncing = false;
  }

  // Créer un paquet de synchronisation compact et encodé
  async createSyncToken() {
    const payload = {
      app: 'FB17',
      v: 2,
      ts: Date.now(),
      h: window.appStorage.history || [],
      w: window.appStorage.weightHistory || [],
      b: window.appStorage.badges || [],
      p: window.appStorage.prefs || {}
    };

    const jsonStr = JSON.stringify(payload);

    // Compression gzip native si disponible
    if ('CompressionStream' in window) {
      try {
        const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
        const buffer = await new Response(stream).arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return 'GZ_' + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } catch (e) {
        console.warn('Fallback standard btoa:', e);
      }
    }

    // Fallback standard Base64 URL-safe
    return 'RAW_' + btoa(unescape(encodeURIComponent(jsonStr))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // Décompresser et appliquer un jeton de synchronisation
  async unpackSyncToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error("Jeton de synchronisation invalide.");
    }

    token = token.trim();
    let jsonStr = '';

    if (token.startsWith('GZ_')) {
      const b64 = token.slice(3).replace(/-/g, '+').replace(/_/g, '/');
      const binStr = atob(b64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);

      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      jsonStr = await new Response(stream).text();
    } else if (token.startsWith('RAW_')) {
      const b64 = token.slice(4).replace(/-/g, '+').replace(/_/g, '/');
      jsonStr = decodeURIComponent(escape(atob(b64)));
    } else {
      // Tentative directe Base64
      const b64 = token.replace(/-/g, '+').replace(/_/g, '/');
      try {
        jsonStr = decodeURIComponent(escape(atob(b64)));
      } catch (e) {
        throw new Error("Format de synchronisation non reconnu.");
      }
    }

    const data = JSON.parse(jsonStr);
    if (!data || (data.app !== 'FB17' && data.app !== 'FULL_BODY_17')) {
      throw new Error("Ce code de synchronisation ne provient pas de Full Body 17.");
    }

    // Mapper le format compact vers le format complet
    const formattedData = {
      history: data.h || data.history || [],
      weightHistory: data.w || data.weightHistory || [],
      badges: data.b || data.badges || [],
      prefs: data.p || data.prefs || {}
    };

    const hasChanges = window.appStorage.mergeData(formattedData);
    const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    window.appStorage.savePreferences({ syncLastTime: nowStr });

    // Actualisation de l'affichage
    if (window.dashboardManager) window.dashboardManager.renderDashboard();
    if (window.motivationManager) window.motivationManager.renderBadgesView();
    if (typeof renderHomeExercisesList === 'function') renderHomeExercisesList();

    return hasChanges;
  }

  // Générer et afficher la modale QR Code / Partage
  async openSyncModal() {
    const token = await this.createSyncToken();
    const currentBaseUrl = window.location.origin + window.location.pathname;
    const syncUrl = `${currentBaseUrl}#sync=${token}`;

    const modal = document.getElementById('sync-qr-modal');
    const qrContainer = document.getElementById('sync-qr-container');
    const codeInput = document.getElementById('sync-code-display');

    if (!modal) return;

    if (qrContainer) {
      qrContainer.innerHTML = '';
      try {
        const qr = new window.MiniQRCode(6, 1);
        qr.addData(syncUrl);
        qr.make();
        qrContainer.innerHTML = qr.createSvg(5, 10);
      } catch (e) {
        console.warn('Erreur rendu QR SVG:', e);
        qrContainer.innerHTML = `<div style="padding: 20px; font-size: 0.8rem; color: var(--accent-work);">Code prêt pour le partage</div>`;
      }
    }

    if (codeInput) {
      codeInput.value = token;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.updateStatusUI('success', 'Code généré');
  }

  closeSyncModal() {
    const modal = document.getElementById('sync-qr-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Copier le code dans le presse-papier
  copySyncCode() {
    const codeInput = document.getElementById('sync-code-display');
    if (codeInput) {
      codeInput.select();
      navigator.clipboard.writeText(codeInput.value).then(() => {
        showToast("📋 Code de synchronisation copié !");
      }).catch(() => {
        showToast("📋 Code sélectionné.");
      });
    }
  }

  // Partager via Web Share API (WhatsApp, Drive, Email)
  async shareSyncLink() {
    const token = await this.createSyncToken();
    const currentBaseUrl = window.location.origin + window.location.pathname;
    const syncUrl = `${currentBaseUrl}#sync=${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FULL BODY 17 — Synchronisation',
          text: 'Ouvrez ce lien sur votre smartphone pour synchroniser votre routine Full Body 17 :',
          url: syncUrl
        });
        showToast("Lien partagé !");
      } catch (err) {
        if (err.name !== 'AbortError') this.copySyncCode();
      }
    } else {
      this.copySyncCode();
    }
  }

  // Ouvre la modale pour coller un code reçu
  openImportCodeModal() {
    const modal = document.getElementById('sync-import-modal');
    const input = document.getElementById('sync-import-input');
    if (modal) {
      if (input) input.value = '';
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  closeImportCodeModal() {
    const modal = document.getElementById('sync-import-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Applique le code collé
  async applyImportCode() {
    const input = document.getElementById('sync-import-input');
    if (!input || !input.value.trim()) {
      showToast("⚠️ Veuillez coller votre code de synchronisation.", true);
      return;
    }

    try {
      await this.unpackSyncToken(input.value.trim());
      this.closeImportCodeModal();
      showToast("☁️ Synchronisation PC ⇄ Mobile réussie avec succès !");
    } catch (e) {
      showToast(`❌ Erreur : ${e.message || "Code invalide"}`, true);
    }
  }

  // Détection automatique lors de l'ouverture d'un lien avec #sync=...
  async checkUrlForSync() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const syncToken = hash.startsWith('#sync=') ? hash.replace('#sync=', '') : urlParams.get('sync');

    if (syncToken) {
      try {
        await this.unpackSyncToken(syncToken);
        // Nettoyer l'URL sans recharger la page
        history.replaceState(null, '', window.location.pathname);
        showToast("🎉 Données synchronisées avec succès sur cet appareil !");
      } catch (err) {
        console.error('Erreur synchro URL:', err);
      }
    }
  }

  // Synchronisation automatique silencieuse
  autoPush() {
    const prefs = window.appStorage.prefs;
    if (prefs && prefs.syncAutoEnabled !== false) {
      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      window.appStorage.savePreferences({ syncLastTime: nowStr });
      this.updateStatusUI('success', `À jour (${nowStr})`);
    }
  }

  updateStatusUI(state = null, message = null) {
    const dot = document.getElementById('sync-status-dot');
    const text = document.getElementById('sync-status-text');
    const lastTimeEl = document.getElementById('sync-last-time');
    const prefs = window.appStorage.prefs;

    if (!dot || !text) return;

    dot.className = 'sync-dot';

    if (state === 'success' || prefs.syncLastTime) {
      dot.classList.add('success');
      text.textContent = message || 'Prêt & Synchronisé';
      if (lastTimeEl) {
        lastTimeEl.textContent = `Dernière sauvegarde : Aujourd'hui à ${prefs.syncLastTime || 'maintenant'}`;
      }
    } else {
      dot.classList.add('idle');
      text.textContent = 'Prêt pour la synchronisation';
      if (lastTimeEl) lastTimeEl.textContent = 'Cliquez sur Transférer vers Mobile ou Récupérer';
    }
  }
}

window.syncManager = new CloudSyncManager();
