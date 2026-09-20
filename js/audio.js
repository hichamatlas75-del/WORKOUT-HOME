/**
 * FULL BODY 17 — MOTEUR AUDIO & COACH VOCAL & MUSIQUE DE FOND MOTIVANTE
 * - Signaux sonores avec Web Audio API
 * - Annonces vocales Web Speech API
 * - Synthétiseur de musique de fond fitness adaptative (100% hors-ligne, zéro latence)
 */

// --------------------------------------------------------------------------
// SYNTHÉTISEUR DE MUSIQUE DE FOND MOTIVANTE (100% WEB AUDIO API, SANS FICHIER LOURD)
// --------------------------------------------------------------------------
// GESTIONNAIRE DE MUSIQUE LOCALE (RÉPERTOIRE DU TÉLÉPHONE / DISQUE)
// Stockage sécurisé et persistant des morceaux audio dans IndexedDB ('fb17_music_db', store 'tracks')
// Évite la limite de 5 Mo du localStorage et garantit un fonctionnement 100% hors-ligne.
// --------------------------------------------------------------------------
class LocalMusicManager {
  constructor() {
    this.dbName = 'fb17_music_db';
    this.dbVersion = 1;
    this.storeName = 'tracks';
    this.db = null;
    this.playlist = []; // [{ id, name, size, type, addedAt }]
    this.currentIndex = 0;
    this.isReady = false;
    this.initPromise = this.initDB()
      .then(() => this.loadPlaylist())
      .catch((e) => {
        console.warn('LocalMusicManager init error:', e);
        return [];
      });
  }

  initDB() {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(this.dbName, this.dbVersion);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'id' });
          }
        };
        req.onsuccess = (e) => {
          this.db = e.target.result;
          this.isReady = true;
          resolve(this.db);
        };
        req.onerror = (e) => {
          console.warn('IndexedDB open error:', e);
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB exception:', err);
        resolve(null);
      }
    });
  }

  loadPlaylist() {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([]);
        return;
      }
      try {
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = req.result || [];
          items.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
          this.playlist = items.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            type: item.type,
            addedAt: item.addedAt
          }));
          if (this.currentIndex >= this.playlist.length) {
            this.currentIndex = 0;
          }
          if (typeof window !== 'undefined' && typeof window.updateLocalMusicUI === 'function') {
            try { window.updateLocalMusicUI(); } catch (e) {}
          }
          resolve(this.playlist);
        };
        req.onerror = () => {
          resolve([]);
        };
      } catch (err) {
        console.warn('loadPlaylist error:', err);
        resolve([]);
      }
    });
  }

  async addFiles(fileList) {
    if (!fileList || fileList.length === 0) return this.playlist;
    await this.initPromise;
    if (!this.db) {
      console.warn('IndexedDB non disponible pour stocker la musique.');
      return this.playlist;
    }

    const files = Array.from(fileList).filter(file => {
      return (file.type && file.type.startsWith('audio/')) ||
             /\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)$/i.test(file.name);
    });

    if (files.length === 0) return this.playlist;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);

        files.forEach((file, index) => {
          const trackRecord = {
            id: 'track_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: file.size,
            type: file.type || 'audio/mpeg',
            blob: file,
            addedAt: Date.now() + index
          };
          store.put(trackRecord);
        });

        tx.oncomplete = async () => {
          await this.loadPlaylist();
          resolve(this.playlist);
        };

        tx.onerror = (e) => {
          console.warn('Transaction addFiles error:', e);
          resolve(this.playlist);
        };
      } catch (err) {
        console.warn('addFiles error:', err);
        resolve(this.playlist);
      }
    });
  }

  async removeTrack(id) {
    await this.initPromise;
    if (!this.db) return this.playlist;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(id);
        tx.oncomplete = async () => {
          await this.loadPlaylist();
          resolve(this.playlist);
        };
        tx.onerror = () => resolve(this.playlist);
      } catch (err) {
        console.warn('removeTrack error:', err);
        resolve(this.playlist);
      }
    });
  }

  async clearAll() {
    await this.initPromise;
    this.playlist = [];
    this.currentIndex = 0;
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
        tx.oncomplete = () => resolve([]);
        tx.onerror = () => resolve([]);
      } catch (err) {
        console.warn('clearAll error:', err);
        resolve([]);
      }
    });
  }

  async getTrackBlob(id) {
    await this.initPromise;
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn('getTrackBlob error:', err);
        resolve(null);
      }
    });
  }

  getCurrentTrack() {
    if (this.playlist.length === 0) return null;
    return this.playlist[this.currentIndex] || this.playlist[0] || null;
  }

  nextTrack() {
    if (this.playlist.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    return this.playlist[this.currentIndex];
  }
}

// --------------------------------------------------------------------------
// SYNTHÉTISEUR DE MUSIQUE DE FOND MOTIVANTE & LECTEUR DE RÉPERTOIRE LOCAL
// --------------------------------------------------------------------------
class WorkoutMusicEngine {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
    this.isPlaying = false;
    this.isPaused = false;
    this.enabled = true;
    this.volume = 0.6;
    this.style = 'synthwave'; // 'synthwave' | 'electro' | 'chill' | 'local'
    this.currentPhase = 'WORK'; // 'WORK' | 'REST' | 'PREPARE'

    this.timerId = null;
    this.stepIndex = 0;
    this.tempo = 124; // BPM
    this.lookaheadMs = 25.0;
    this.scheduleAheadSec = 0.12;
    this.nextNoteTime = 0.0;

    this.masterMusicGain = null;
    this.duckGain = null;
    this.noiseBuffer = null;
    this.activeNodes = new Set();

    // Piste locale & Ducking multi-raisons
    this.localAudioElement = null;
    this.currentBlobUrl = null;
    this.duckMultiplier = 1.0;
    this.duckReasons = new Map(); // Map<string, number> (ex: 'voice' => 0.15, 'countdown' => 0.20, 'tone' => 0.20)
    this._localVolRampTimer = null;
  }

  // Création du buffer de bruit blanc pour percussions
  initNoiseBuffer() {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx || this.noiseBuffer) return;
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // Initialisation du bus audio de la musique avec ducking
  ensureAudioGraph() {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;
    if (!this.masterMusicGain) {
      this.masterMusicGain = ctx.createGain();
      this.duckGain = ctx.createGain();

      this.masterMusicGain.gain.setValueAtTime(this.volume, ctx.currentTime);
      this.duckGain.gain.setValueAtTime(this.duckMultiplier, ctx.currentTime);

      this.masterMusicGain.connect(this.duckGain);
      this.duckGain.connect(ctx.destination);
    }
    this.initNoiseBuffer();
  }

  ensureLocalAudioElement() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
    if (!this.localAudioElement) {
      this.localAudioElement = new Audio();
      this.localAudioElement.preload = 'auto';
      this.localAudioElement.addEventListener('ended', () => {
        this.playNextLocalTrack();
      });
      this.localAudioElement.addEventListener('error', (e) => {
        console.warn('Erreur lecture piste audio locale, passage à la suivante:', e);
        if (this.isPlaying && this.style === 'local') {
          setTimeout(() => this.playNextLocalTrack(), 400);
        }
      });
    }
    this.updateLocalAudioVolume(0);
    return this.localAudioElement;
  }

  smoothSetLocalAudioVolume(targetVolume, durationMs = 120) {
    if (!this.localAudioElement) return;
    if (this._localVolRampTimer) {
      clearInterval(this._localVolRampTimer);
      this._localVolRampTimer = null;
    }
    const endVol = Math.max(0, Math.min(1, targetVolume));
    const startVol = (typeof this.localAudioElement.volume === 'number' && !isNaN(this.localAudioElement.volume))
      ? this.localAudioElement.volume
      : endVol;

    if (durationMs <= 20 || Math.abs(endVol - startVol) < 0.02) {
      this.localAudioElement.volume = endVol;
      return;
    }

    const steps = 8;
    const stepTime = Math.max(10, Math.floor(durationMs / steps));
    let step = 0;
    this._localVolRampTimer = setInterval(() => {
      step++;
      const current = startVol + (endVol - startVol) * (step / steps);
      this.localAudioElement.volume = Math.max(0, Math.min(1, current));
      if (step >= steps) {
        clearInterval(this._localVolRampTimer);
        this._localVolRampTimer = null;
        this.localAudioElement.volume = endVol;
      }
    }, stepTime);
  }

  updateLocalAudioVolume(durationMs = 120) {
    if (!this.localAudioElement) return;
    const target = this.volume * this.duckMultiplier;
    this.smoothSetLocalAudioVolume(target, durationMs);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, parseFloat(val) || 0.6));
    if (this.masterMusicGain && this.soundEngine.audioCtx) {
      const t = this.soundEngine.audioCtx.currentTime;
      this.masterMusicGain.gain.cancelScheduledValues(t);
      this.masterMusicGain.gain.linearRampToValueAtTime(this.volume, t + 0.05);
    }
    this.updateLocalAudioVolume(60);
  }

  setStyle(style) {
    if (['synthwave', 'electro', 'chill', 'local'].includes(style)) {
      const prevStyle = this.style;
      this.style = style;
      if (style === 'electro') this.tempo = 128;
      else if (style === 'synthwave') this.tempo = 124;
      else if (style === 'chill') this.tempo = 100;

      if (this.isPlaying) {
        if (prevStyle === 'local' && style !== 'local') {
          if (this.localAudioElement) {
            try { this.localAudioElement.pause(); } catch (e) {}
          }
          this.soundEngine.initContext();
          this.ensureAudioGraph();
          const ctx = this.soundEngine.audioCtx;
          if (ctx) {
            this.nextNoteTime = ctx.currentTime + 0.05;
            this.schedulerLoop();
          }
        } else if (prevStyle !== 'local' && style === 'local') {
          if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
          }
          this.activeNodes.forEach(node => {
            try { node.stop(); } catch (e) {}
          });
          this.activeNodes.clear();
          this.startLocalMusicPlayback();
        }
      }
    }
  }

  // Baisse temporaire du volume pendant la voix ou le décompte (Ducking multi-raisons)
  duck(targetGain = 0.18, durationMs = 120, reason = 'default') {
    if (typeof targetGain === 'string') {
      const tmp = reason;
      reason = targetGain;
      targetGain = typeof durationMs === 'number' ? durationMs : 0.18;
      durationMs = typeof tmp === 'number' ? tmp : 120;
    }

    this.duckReasons.set(reason, targetGain);

    let minGain = 1.0;
    for (const gain of this.duckReasons.values()) {
      if (gain < minGain) minGain = gain;
    }
    this.duckMultiplier = minGain;

    if (this.duckGain && this.soundEngine.audioCtx) {
      try {
        const ctx = this.soundEngine.audioCtx;
        const t = ctx.currentTime;
        this.duckGain.gain.cancelScheduledValues(t);
        this.duckGain.gain.linearRampToValueAtTime(minGain, t + durationMs / 1000);
      } catch (e) {}
    }
    this.updateLocalAudioVolume(durationMs);
  }

  unduck(durationMs = 400, reason = 'default') {
    if (typeof durationMs === 'string') {
      const tmp = reason;
      reason = durationMs;
      durationMs = typeof tmp === 'number' ? tmp : 400;
    }

    this.duckReasons.delete(reason);

    if (this.duckReasons.size > 0) {
      // D'autres raisons de ducking restent actives (ex: coach vocal encore en train de parler)
      let minGain = 1.0;
      for (const gain of this.duckReasons.values()) {
        if (gain < minGain) minGain = gain;
      }
      this.duckMultiplier = minGain;
      if (this.duckGain && this.soundEngine.audioCtx) {
        try {
          const ctx = this.soundEngine.audioCtx;
          const t = ctx.currentTime;
          this.duckGain.gain.cancelScheduledValues(t);
          this.duckGain.gain.linearRampToValueAtTime(minGain, t + durationMs / 1000);
        } catch (e) {}
      }
      this.updateLocalAudioVolume(durationMs);
      return;
    }

    // Plus aucune raison active -> retour fluide au volume normal
    this.duckMultiplier = 1.0;
    if (this.duckGain && this.soundEngine.audioCtx) {
      try {
        const ctx = this.soundEngine.audioCtx;
        const t = ctx.currentTime;
        this.duckGain.gain.cancelScheduledValues(t);
        this.duckGain.gain.linearRampToValueAtTime(1.0, t + durationMs / 1000);
      } catch (e) {}
    }
    this.updateLocalAudioVolume(durationMs);
  }

  stopAllDucking(durationMs = 150) {
    this.duckReasons.clear();
    this.duckMultiplier = 1.0;
    if (this.duckGain && this.soundEngine.audioCtx) {
      try {
        const ctx = this.soundEngine.audioCtx;
        const t = ctx.currentTime;
        this.duckGain.gain.cancelScheduledValues(t);
        this.duckGain.gain.linearRampToValueAtTime(1.0, t + durationMs / 1000);
      } catch (e) {}
    }
    this.updateLocalAudioVolume(durationMs);
  }

  // Démarrer la musique
  start(phase = 'WORK') {
    if (!this.enabled) return;
    this.soundEngine.initContext();
    this.ensureAudioGraph();

    this.currentPhase = phase;
    this.isPlaying = true;
    this.isPaused = false;
    this.stepIndex = 0;

    if (this.style === 'local') {
      this.startLocalMusicPlayback();
      return;
    }

    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;
    this.nextNoteTime = ctx.currentTime + 0.05;

    this.schedulerLoop();
  }

  async startLocalMusicPlayback() {
    this.ensureLocalAudioElement();
    const mgr = this.soundEngine.localMusicManager;
    if (!mgr) return;
    await mgr.initPromise;

    if (!mgr.playlist || mgr.playlist.length === 0) {
      // Si la playlist locale est vide, fallback transparent vers le synthétiseur
      const ctx = this.soundEngine.audioCtx;
      if (ctx) {
        this.nextNoteTime = ctx.currentTime + 0.05;
        this.schedulerLoop();
      }
      return;
    }

    this.playCurrentLocalTrack();
  }

  async playCurrentLocalTrack() {
    if (!this.isPlaying || this.isPaused || !this.enabled) return;
    this.ensureLocalAudioElement();
    if (!this.localAudioElement) return;

    const mgr = this.soundEngine.localMusicManager;
    if (!mgr) return;
    const track = mgr.getCurrentTrack();
    if (!track) return;

    try {
      const blob = await mgr.getTrackBlob(track.id);
      if (!blob) {
        this.playNextLocalTrack();
        return;
      }
      if (this.currentBlobUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(this.currentBlobUrl);
      }
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        this.currentBlobUrl = URL.createObjectURL(blob);
        this.localAudioElement.src = this.currentBlobUrl;
        this.updateLocalAudioVolume();
        const p = this.localAudioElement.play();
        if (p && typeof p.catch === 'function') {
          p.catch(err => {
            console.warn('Lecture musique locale bloquée par le navigateur (autoplay) :', err);
          });
        }
      }
    } catch (e) {
      console.warn('Erreur lecture piste locale :', e);
    }
  }

  playNextLocalTrack() {
    const mgr = this.soundEngine.localMusicManager;
    if (!mgr) return;
    mgr.nextTrack();
    this.playCurrentLocalTrack();
  }

  setPhase(phase) {
    this.currentPhase = phase;
  }

  togglePause(isPaused) {
    if (typeof isPaused === 'boolean') {
      this.isPaused = isPaused;
    } else {
      this.isPaused = !this.isPaused;
    }

    if (this.style === 'local' && this.localAudioElement) {
      if (this.isPaused) {
        try { this.localAudioElement.pause(); } catch (e) {}
      } else if (this.isPlaying && this.enabled) {
        try {
          const p = this.localAudioElement.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      }
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    this.activeNodes.clear();

    if (this.localAudioElement) {
      try {
        this.localAudioElement.pause();
        this.localAudioElement.currentTime = 0;
      } catch (e) {}
    }
    if (this.currentBlobUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try { URL.revokeObjectURL(this.currentBlobUrl); } catch (e) {}
      this.currentBlobUrl = null;
    }
  }

  // Boucle de planification de notes en continu
  schedulerLoop() {
    if (!this.isPlaying) return;

    const ctx = this.soundEngine.audioCtx;
    while (this.nextNoteTime < ctx.currentTime + this.scheduleAheadSec) {
      if (!this.isPaused && this.enabled) {
        this.scheduleStep(this.stepIndex, this.nextNoteTime);
      }
      const secondsPer16th = (60.0 / this.tempo) / 4.0;
      this.nextNoteTime += secondsPer16th;
      this.stepIndex = (this.stepIndex + 1) % 64; // Mesure de 4 bars (64 double-croches)
    }

    this.timerId = setTimeout(() => this.schedulerLoop(), this.lookaheadMs);
  }

  // Planification d'une étape de la boucle musicale
  scheduleStep(step, time) {
    const isWork = this.currentPhase === 'WORK';
    const isRest = this.currentPhase === 'REST';
    const isPrep = this.currentPhase === 'PREPARE';

    const beatInBar = Math.floor((step % 16) / 4); // 0, 1, 2, 3
    const stepInBeat = step % 4; // 0, 1, 2, 3
    const barIndex = Math.floor(step / 16); // 0, 1, 2, 3

    // Progressions harmoniques (Fondamentales)
    // Synthwave / Electro : Am (110Hz), F (87.3Hz), C (130.8Hz), G (98Hz)
    const chordRoots = [110.0, 87.31, 130.81, 97.99]; // A2, F2, C3, G2
    const currentRoot = chordRoots[barIndex % 4];

    // 1. Kick Drum
    if (isWork) {
      // 4-on-the-floor kick
      if (stepInBeat === 0) {
        this.playKick(time, 1.0);
      }
    } else if (isRest) {
      // Repos : battement très doux sur 1 et 3
      if ((beatInBar === 0 || beatInBar === 2) && stepInBeat === 0) {
        this.playKick(time, 0.45, 90, 40);
      }
    } else if (isPrep) {
      // Préparation : pulsation rythmée
      if (stepInBeat === 0) {
        this.playKick(time, 0.6);
      }
    }

    // 2. Snare / Clap sur les temps 2 et 4 pendant l'effort
    if (isWork && (beatInBar === 1 || beatInBar === 3) && stepInBeat === 0) {
      this.playSnare(time, 0.7);
    }

    // 3. Hi-Hats (Charlestons)
    if (isWork) {
      // Offbeat open hi-hat & 16th closed hi-hats
      if (stepInBeat === 2) {
        this.playHiHat(time, true, 0.55); // Contretemps
      } else if (step % 2 === 0) {
        this.playHiHat(time, false, 0.35);
      }
    } else if (isRest) {
      // Hi-hats doux et discrets
      if (stepInBeat === 2) {
        this.playHiHat(time, false, 0.15);
      }
    }

    // 4. Ligne de Basse (Synth Bassline)
    if (isWork) {
      // Ligne de basse roulante énergique (Rolling Bass)
      let bassFreq = currentRoot;
      if (step % 2 === 0) {
        // Octave supérieure sur les contretemps
        if (stepInBeat === 2) bassFreq = currentRoot * 2;
        this.playBass(time, bassFreq, 0.14, 0.85);
      }
    } else if (isRest) {
      // Basse douce tenue sur les débuts d'accords
      if (step % 16 === 0) {
        this.playPad(time, currentRoot, 2.2, 0.35);
      }
    }

    // 5. Synthwave Arpège / Mélodie
    if (isWork) {
      const arpScales = [
        [0, 3, 7, 10, 12, 15, 19, 12], // Am
        [0, 4, 7, 11, 12, 16, 19, 12], // F
        [0, 4, 7, 12, 14, 16, 19, 16], // C
        [0, 4, 7, 9, 12, 14, 19, 14]   // G
      ];
      const scale = arpScales[barIndex % 4];
      const semitone = scale[(step % 8)];
      const noteFreq = (currentRoot * 2) * Math.pow(2, semitone / 12);

      if (step % 2 === 0) {
        this.playArpNote(time, noteFreq, 0.12, 0.4);
      }
    } else if (isRest) {
      // Nappes planantes d'accords relaxants pendant la récupération
      if (step % 8 === 0) {
        const chordNotes = [currentRoot * 2, currentRoot * 2.5, currentRoot * 3];
        chordNotes.forEach(freq => this.playPad(time, freq, 1.4, 0.2));
      }
    }
  }

  // --- INSTRUMENTS VIRTUELS SYNTHÉTIQUES ---

  playKick(time, intensity = 1.0, startFreq = 140, endFreq = 36) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.09);

    gain.gain.setValueAtTime(0.75 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + 0.25);

    this.activeNodes.add(osc);
    osc.onended = () => this.activeNodes.delete(osc);
  }

  playSnare(time, intensity = 0.7) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;

    // Composante Bruit
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(this.style === 'electro' ? 2200 : 1600, time);
      filter.Q.setValueAtTime(1.8, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45 * intensity, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterMusicGain);

      noise.start(time);
      noise.stop(time + 0.17);

      this.activeNodes.add(noise);
      noise.onended = () => this.activeNodes.delete(noise);
    }

    // Composante Tonale
    const osc = ctx.createOscillator();
    const toneGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.09);

    toneGain.gain.setValueAtTime(0.3 * intensity, time);
    toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(toneGain);
    toneGain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + 0.1);

    this.activeNodes.add(osc);
    osc.onended = () => this.activeNodes.delete(osc);
  }

  playHiHat(time, open = false, intensity = 0.5) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx || !this.noiseBuffer) return;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = ctx.createGain();
    const dur = open ? 0.18 : 0.04;
    gain.gain.setValueAtTime(0.28 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    noise.start(time);
    noise.stop(time + dur + 0.01);

    this.activeNodes.add(noise);
    noise.onended = () => this.activeNodes.delete(noise);
  }

  playBass(time, freq, dur = 0.14, intensity = 0.8) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = this.style === 'electro' ? 'sawtooth' : 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, time);
    filter.frequency.exponentialRampToValueAtTime(850, time + 0.03);
    filter.frequency.exponentialRampToValueAtTime(260, time + dur);
    filter.Q.setValueAtTime(3.5, time);

    gain.gain.setValueAtTime(0.35 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + dur + 0.01);

    this.activeNodes.add(osc);
    osc.onended = () => this.activeNodes.delete(osc);
  }

  playArpNote(time, freq, dur = 0.12, intensity = 0.4) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + dur);

    gain.gain.setValueAtTime(0.18 * intensity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + dur + 0.01);

    this.activeNodes.add(osc);
    osc.onended = () => this.activeNodes.delete(osc);
  }

  playPad(time, freq, dur = 1.5, intensity = 0.3) {
    const ctx = this.soundEngine.audioCtx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.15 * intensity, time + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(time);
    osc.stop(time + dur + 0.05);

    this.activeNodes.add(osc);
    osc.onended = () => this.activeNodes.delete(osc);
  }
}

// --------------------------------------------------------------------------
// MOTEUR AUDIO GLOBAL
// --------------------------------------------------------------------------
class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.soundEnabled = true;
    this.voiceEnabled = true;
    this.cachedVoices = [];

    if (this.speechSynth) {
      this.cachedVoices = this.speechSynth.getVoices();
      if (this.speechSynth.onvoiceschanged !== undefined) {
        this.speechSynth.onvoiceschanged = () => {
          this.cachedVoices = this.speechSynth.getVoices();
        };
      }
    }

    this.localMusicManager = new LocalMusicManager();
    this.musicEngine = new WorkoutMusicEngine(this);
  }

  // Initialisation sécurisée au premier contact utilisateur
  initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.speechSynth && (!this.cachedVoices || this.cachedVoices.length === 0)) {
      this.cachedVoices = this.speechSynth.getVoices();
    }
  }

  // Bip de compte à rebours (3, 2, 1) avec baisse continue du volume de musique
  playCountdownBeep(num) {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      // Baisse le volume pour le décompte 3s et le maintient abaissé tout le long
      this.musicEngine.duck(0.20, 80, 'countdown');

      // Renouvelle le timer de sécurité (1.7s max sans nouveau bip avant restauration auto)
      if (this._countdownUnduckTimer) clearTimeout(this._countdownUnduckTimer);
      this._countdownUnduckTimer = setTimeout(() => {
        this.musicEngine.unduck(300, 'countdown');
      }, 1700);

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const baseFreq = num === 1 ? 659.25 : (num === 2 ? 587.33 : 523.25); // E5, D5, C5
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.30, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.20);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.20);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Signal sonore énergisant de départ (GO / Effort)
  playGoTone() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      if (this._countdownUnduckTimer) {
        clearTimeout(this._countdownUnduckTimer);
        this._countdownUnduckTimer = null;
      }
      this.musicEngine.unduck(60, 'countdown');
      this.musicEngine.duck(0.20, 60, 'tone');

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25); // A5

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      setTimeout(() => this.musicEngine.unduck(300, 'tone'), 380);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Signal sonore apaisant pour le début de récupération
  playRestTone() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      if (this._countdownUnduckTimer) {
        clearTimeout(this._countdownUnduckTimer);
        this._countdownUnduckTimer = null;
      }
      this.musicEngine.unduck(60, 'countdown');
      this.musicEngine.duck(0.20, 60, 'tone');

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35); // A4

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);

      setTimeout(() => this.musicEngine.unduck(300, 'tone'), 420);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Signal sonore de mi-temps (ex: alternance de côté)
  playHalfTimeTone() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      this.musicEngine.duck(0.20, 60, 'tone');
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.2);

      setTimeout(() => this.musicEngine.unduck(300, 'tone'), 300);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Fanfare de victoire / Séance terminée
  playVictoryFanfare() {
    if (!this.soundEnabled) return;
    this.initContext();
    if (!this.audioCtx) return;

    this.musicEngine.stop();

    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.18 }, // G5
      { f: 1046.50, d: 0.45 } // C6
    ];

    let t = this.audioCtx.currentTime;
    notes.forEach((note) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(t);
      osc.stop(t + note.d);

      t += note.d * 0.85;
    });
  }

  // Annonce vocale par synthèse vocale en français avec ducking prioritaire de musique
  speak(text) {
    if (!this.voiceEnabled || !this.speechSynth) return;

    try {
      // Ducking prioritaire : la musique descend à 15% pour laisser la voix parfaitement claire
      this.musicEngine.duck(0.15, 80, 'voice');

      if (this._voiceUnduckTimer) {
        clearTimeout(this._voiceUnduckTimer);
        this._voiceUnduckTimer = null;
      }

      this.speechSynth.cancel(); // Annule la phrase précédente

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = (this.cachedVoices && this.cachedVoices.length > 0) ? this.cachedVoices : this.speechSynth.getVoices();
      const frVoice = voices.find(v => v.lang && v.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }

      const onVoiceFinished = () => {
        if (this._voiceUnduckTimer) {
          clearTimeout(this._voiceUnduckTimer);
          this._voiceUnduckTimer = null;
        }
        // Légère pause après la voix avant de remonter la musique
        setTimeout(() => {
          this.musicEngine.unduck(400, 'voice');
        }, 120);
      };

      utterance.onend = () => {
        onVoiceFinished();
      };

      utterance.onerror = (err) => {
        // Ignorer l'erreur 'canceled' provoquée par une nouvelle annonce consécutive
        if (err && err.error === 'canceled') return;
        onVoiceFinished();
      };

      // Fallback sécurité si onend n'est pas déclenché (protection mobile)
      const estimatedDurationMs = Math.max(1600, text.length * 85);
      this._voiceUnduckTimer = setTimeout(onVoiceFinished, estimatedDurationMs + 500);

      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.musicEngine.unduck(200, 'voice');
    }
  }
}

// Instance globale du moteur audio
window.audioEngine = new SoundEngine();
