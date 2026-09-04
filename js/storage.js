/**
 * FULL BODY 17 — GESTIONNAIRE DU STOCKAGE LOCAL (LOCALSTORAGE)
 * Support Multi-Utilisateurs, Sauvegarde de l'historique des séances, séries (streaks), poids et réglages.
 */

const STORAGE_KEYS = {
  PROFILES: 'fb17_profiles',
  ACTIVE_PROFILE: 'fb17_active_profile_id',
  PREFS: 'fb17_preferences',
  HISTORY: 'fb17_workout_history',
  BADGES: 'fb17_unlocked_badges',
  WEIGHT: 'fb17_weight_history'
};

const DEFAULT_PREFERENCES = {
  userName: "Moi",
  userAvatar: "🦁",
  userLevel: "intermediate", // "beginner" | "intermediate" | "advanced" | "custom"
  customExerciseIds: null, // Tableau d'IDs d'exercices si mode personnalisé
  rounds: 3,
  workDuration: 40,
  restDuration: 20,
  plankDuration: 45, // 30, 45, 60, 120 (2 min)
  targetTime: "17:00",
  targetWeight: null, // Poids cible en kg
  initialWeight: null, // Poids de départ en kg
  heightCm: null, // Taille en cm pour calcul IMC
  soundEnabled: true,
  voiceEnabled: true,
  musicEnabled: true,
  musicVolume: 0.6,
  musicStyle: "synthwave", // "synthwave" | "electro" | "chill"
  theme: "dark",
  reminderActive: true,
  firebaseUrl: "",
  firebaseAuthToken: "",
  syncUserId: "",
  syncUserPin: "",
  syncAutoEnabled: true,
  syncLastTime: null
};

class AppStorage {
  constructor() {
    this.profiles = this.loadProfiles();
    this.activeProfileId = this.loadActiveProfileId();
    this.ensureActiveProfileExists();

    this.prefs = this.loadPreferences();
    this.history = this.loadHistory();
    this.badges = this.loadBadges();
    this.weightHistory = this.loadWeightHistory();
  }

  // --- Gestion des Clés Multi-Profils ---
  getPrefKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') ? STORAGE_KEYS.PREFS : `fb17_prof_${profileId}_preferences`;
  }

  getHistoryKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') ? STORAGE_KEYS.HISTORY : `fb17_prof_${profileId}_history`;
  }

  getBadgesKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') ? STORAGE_KEYS.BADGES : `fb17_prof_${profileId}_badges`;
  }

  getWeightKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') ? STORAGE_KEYS.WEIGHT : `fb17_prof_${profileId}_weight`;
  }

  // --- Gestion Multi-Profils ---
  loadProfiles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erreur lecture profiles:', e);
    }

    // Profil par défaut initialisé avec les données existantes s'il y en a
    const defaultProfile = {
      id: 'default',
      name: 'Moi',
      avatar: '🦁',
      level: 'intermediate',
      createdAt: Date.now()
    };
    return [defaultProfile];
  }

  saveProfiles() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
    } catch (e) {
      console.error('Erreur sauvegarde profils:', e);
    }
  }

  loadActiveProfileId() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
      return stored || 'default';
    } catch (e) {
      return 'default';
    }
  }

  ensureActiveProfileExists() {
    const exists = this.profiles.some(p => p.id === this.activeProfileId);
    if (!exists) {
      this.activeProfileId = this.profiles[0] ? this.profiles[0].id : 'default';
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, this.activeProfileId);
      } catch (e) {}
    }
  }

  getProfiles() {
    return [...this.profiles];
  }

  getActiveProfileId() {
    return this.activeProfileId;
  }

  getActiveProfile() {
    return this.profiles.find(p => p.id === this.activeProfileId) || this.profiles[0];
  }

  createProfile({ name = 'Nouvel Utilisateur', avatar = '⚡', level = 'intermediate', initialWeight = null, targetWeight = null, heightCm = null }) {
    const id = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newProfile = {
      id,
      name: (name || '').trim() || 'Utilisateur',
      avatar: avatar || '⚡',
      level: level || 'intermediate',
      createdAt: Date.now()
    };

    this.profiles.push(newProfile);
    this.saveProfiles();

    // Initialiser les préférences spécifiques du nouveau profil
    const newPrefs = {
      ...DEFAULT_PREFERENCES,
      userName: newProfile.name,
      userAvatar: newProfile.avatar,
      userLevel: newProfile.level,
      initialWeight: initialWeight !== null ? initialWeight : null,
      targetWeight: targetWeight !== null ? targetWeight : null,
      heightCm: heightCm !== null ? heightCm : null
    };

    try {
      localStorage.setItem(this.getPrefKey(id), JSON.stringify(newPrefs));
      localStorage.setItem(this.getHistoryKey(id), JSON.stringify([]));
      localStorage.setItem(this.getBadgesKey(id), JSON.stringify([]));
      localStorage.setItem(this.getWeightKey(id), JSON.stringify([]));
    } catch (e) {
      console.error('Erreur initialisation stockage profil:', e);
    }

    return newProfile;
  }

  switchProfile(profileId) {
    const target = this.profiles.find(p => p.id === profileId);
    if (!target) return null;

    this.activeProfileId = profileId;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, this.activeProfileId);
    } catch (e) {}

    // Recharger toutes les données en mémoire
    this.prefs = this.loadPreferences();
    this.history = this.loadHistory();
    this.badges = this.loadBadges();
    this.weightHistory = this.loadWeightHistory();

    return target;
  }

  updateProfile(profileId, updateData = {}) {
    const index = this.profiles.findIndex(p => p.id === profileId);
    if (index < 0) return null;

    this.profiles[index] = { ...this.profiles[index], ...updateData };
    this.saveProfiles();

    // Synchroniser avec les prefs si c'est le profil actif
    if (profileId === this.activeProfileId) {
      const syncPrefs = {};
      if (updateData.name) syncPrefs.userName = updateData.name;
      if (updateData.avatar) syncPrefs.userAvatar = updateData.avatar;
      if (updateData.level) syncPrefs.userLevel = updateData.level;
      if (Object.keys(syncPrefs).length > 0) {
        this.savePreferences(syncPrefs);
      }
    }

    return this.profiles[index];
  }

  deleteProfile(profileId) {
    if (this.profiles.length <= 1) {
      console.warn('Impossible de supprimer le seul profil existant.');
      return false;
    }

    const wasActive = this.activeProfileId === profileId;
    this.profiles = this.profiles.filter(p => p.id !== profileId);
    this.saveProfiles();

    // Supprimer les données du profil dans localStorage
    try {
      localStorage.removeItem(this.getPrefKey(profileId));
      localStorage.removeItem(this.getHistoryKey(profileId));
      localStorage.removeItem(this.getBadgesKey(profileId));
      localStorage.removeItem(this.getWeightKey(profileId));
    } catch (e) {}

    if (wasActive) {
      this.switchProfile(this.profiles[0].id);
    }

    return true;
  }

  // --- Préférences ---
  loadPreferences() {
    try {
      const stored = localStorage.getItem(this.getPrefKey());
      const activeProf = this.getActiveProfile();
      const baseDefaults = {
        ...DEFAULT_PREFERENCES,
        userName: activeProf ? activeProf.name : DEFAULT_PREFERENCES.userName,
        userAvatar: activeProf ? activeProf.avatar : DEFAULT_PREFERENCES.userAvatar,
        userLevel: activeProf ? (activeProf.level || 'intermediate') : DEFAULT_PREFERENCES.userLevel
      };
      return stored ? { ...baseDefaults, ...JSON.parse(stored) } : { ...baseDefaults };
    } catch (e) {
      console.warn('Erreur lecture prefs:', e);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  savePreferences(newPrefs) {
    this.prefs = { ...this.prefs, ...newPrefs };
    try {
      localStorage.setItem(this.getPrefKey(), JSON.stringify(this.prefs));

      // Mettre à jour l'objet profil courant si nom, avatar ou niveau changent
      const activeProf = this.getActiveProfile();
      if (activeProf) {
        let changed = false;
        if (newPrefs.userName && activeProf.name !== newPrefs.userName) {
          activeProf.name = newPrefs.userName;
          changed = true;
        }
        if (newPrefs.userAvatar && activeProf.avatar !== newPrefs.userAvatar) {
          activeProf.avatar = newPrefs.userAvatar;
          changed = true;
        }
        if (newPrefs.userLevel && activeProf.level !== newPrefs.userLevel) {
          activeProf.level = newPrefs.userLevel;
          changed = true;
        }
        if (changed) this.saveProfiles();
      }
      return true;
    } catch (e) {
      console.error('Erreur sauvegarde prefs:', e);
      return false;
    }
  }

  // --- Historique des séances ---
  loadHistory() {
    try {
      const stored = localStorage.getItem(this.getHistoryKey());
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('Erreur lecture historique:', e);
      return [];
    }
  }

  addWorkoutSession(sessionData) {
    const now = new Date();
    const session = {
      id: 'ws_' + Date.now(),
      date: sessionData.date || this.formatDateISO(now),
      timestamp: Date.now(),
      durationSeconds: sessionData.durationSeconds || 960,
      rounds: sessionData.rounds || 2,
      completed: sessionData.completed !== undefined ? sessionData.completed : true,
      exercisesCount: sessionData.exercisesCount || 8,
      level: sessionData.level || this.prefs.userLevel || 'intermediate',
      caloriesEstimated: Math.round(((sessionData.durationSeconds || 960) / 60) * 8.5)
    };

    this.history.unshift(session);
    try {
      localStorage.setItem(this.getHistoryKey(), JSON.stringify(this.history));
    } catch (e) {
      console.error('Erreur enregistrement séance:', e);
    }
    return session;
  }

  // --- Badges ---
  loadBadges() {
    try {
      const stored = localStorage.getItem(this.getBadgesKey());
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  unlockBadge(badgeId) {
    if (!this.badges.includes(badgeId)) {
      this.badges.push(badgeId);
      try {
        localStorage.setItem(this.getBadgesKey(), JSON.stringify(this.badges));
      } catch (e) {
        console.error('Erreur unlock badge:', e);
      }
      return true;
    }
    return false;
  }

  // --- Utilitaires de dates & formatage ---
  formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // --- Calculs Statistiques Clés ---
  getTotalWorkouts() {
    return this.history.filter(s => s.completed).length;
  }

  getTotalTrainingMinutes() {
    const totalSecs = this.history
      .filter(s => s.completed)
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    return Math.round(totalSecs / 60);
  }

  getWorkoutsThisMonth() {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.history.filter(s => s.completed && s.date.startsWith(currentMonthPrefix)).length;
  }

  // Calcul rigoureux du Streak (jours consécutifs)
  getStreakStats() {
    const completedSessions = this.history.filter(s => s.completed);
    if (completedSessions.length === 0) {
      return { currentStreak: 0, bestStreak: 0, doneToday: false };
    }

    // Récupérer la liste des jours uniques d'entraînement triés par ordre décroissant
    const uniqueDays = Array.from(new Set(completedSessions.map(s => s.date))).sort().reverse();
    
    const today = this.formatDateISO(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = this.formatDateISO(yesterdayDate);

    const doneToday = uniqueDays.includes(today);

    // Calcul du streak en cours
    let currentStreak = 0;
    let checkDate = new Date();

    // Si pas fait aujourd'hui, vérifier si le streak était actif hier
    if (!doneToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = this.formatDateISO(checkDate);
      if (uniqueDays.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calcul du meilleur streak historique
    let bestStreak = 0;
    if (uniqueDays.length > 0) {
      let tempStreak = 1;
      bestStreak = 1;

      for (let i = 0; i < uniqueDays.length - 1; i++) {
        const d1 = new Date(uniqueDays[i]);
        const d2 = new Date(uniqueDays[i + 1]);
        const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > bestStreak) bestStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      }
    }

    if (currentStreak > bestStreak) bestStreak = currentStreak;

    return {
      currentStreak,
      bestStreak,
      doneToday
    };
  }

  // Dictionnaire Date -> Nombre de séances pour le calendrier
  getWorkoutsByDateMap() {
    const map = {};
    this.history.forEach(s => {
      if (s.completed) {
        map[s.date] = (map[s.date] || 0) + 1;
      }
    });
    return map;
  }

  // --- Suivi du Poids (Module Prise / Perte de Poids) ---
  loadWeightHistory() {
    try {
      const stored = localStorage.getItem(this.getWeightKey());
      const parsed = stored ? JSON.parse(stored) : [];
      // Tri chronologique croissant par date
      return parsed.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (e) {
      console.warn('Erreur lecture historique poids:', e);
      return [];
    }
  }

  addWeightEntry({ weight, date, note = '' }) {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight < 20 || numWeight > 300) {
      console.error('Poids invalide :', weight);
      return null;
    }

    const entryDate = date || this.formatDateISO(new Date());

    // Vérifier si une pesée existe déjà pour cette date -> mettre à jour
    const existingIndex = this.weightHistory.findIndex(w => w.date === entryDate);

    const entry = {
      id: 'w_' + (existingIndex >= 0 ? this.weightHistory[existingIndex].id.replace('w_', '') : Date.now()),
      date: entryDate,
      weight: Math.round(numWeight * 10) / 10,
      note: (note || '').trim().slice(0, 100),
      timestamp: Date.now()
    };

    if (existingIndex >= 0) {
      this.weightHistory[existingIndex] = entry;
    } else {
      this.weightHistory.push(entry);
    }

    // Garder le tri chronologique
    this.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    try {
      localStorage.setItem(this.getWeightKey(), JSON.stringify(this.weightHistory));
    } catch (e) {
      console.error('Erreur sauvegarde poids:', e);
    }

    return entry;
  }

  deleteWeightEntry(id) {
    this.weightHistory = this.weightHistory.filter(w => w.id !== id);
    try {
      localStorage.setItem(this.getWeightKey(), JSON.stringify(this.weightHistory));
    } catch (e) {
      console.error('Erreur suppression poids:', e);
    }
  }

  getWeightStats() {
    if (this.weightHistory.length === 0) {
      const initW = parseFloat(this.prefs.initialWeight) || null;
      const targetW = parseFloat(this.prefs.targetWeight) || null;
      return {
        hasData: false,
        currentWeight: initW,
        startWeight: initW,
        targetWeight: targetW,
        delta: 0,
        deltaFormatted: '0.0 kg',
        minWeight: initW,
        maxWeight: initW,
        entriesCount: 0,
        lastDate: null,
        bmi: this.calculateBMI(initW),
        targetDiff: (initW && targetW) ? Math.round((initW - targetW) * 10) / 10 : null
      };
    }

    const first = this.weightHistory[0];
    const latest = this.weightHistory[this.weightHistory.length - 1];
    const startWeight = parseFloat(this.prefs.initialWeight) || first.weight;
    const targetWeight = parseFloat(this.prefs.targetWeight) || null;
    const delta = Math.round((latest.weight - startWeight) * 10) / 10;
    const deltaFormatted = (delta > 0 ? `+${delta.toFixed(1)}` : `${delta.toFixed(1)}`) + ' kg';

    const weights = this.weightHistory.map(w => w.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    const targetDiff = targetWeight ? Math.round((latest.weight - targetWeight) * 10) / 10 : null;

    return {
      hasData: true,
      currentWeight: latest.weight,
      startWeight: startWeight,
      targetWeight: targetWeight,
      delta: delta,
      deltaFormatted: deltaFormatted,
      minWeight: minWeight,
      maxWeight: maxWeight,
      entriesCount: this.weightHistory.length,
      lastDate: latest.date,
      bmi: this.calculateBMI(latest.weight),
      targetDiff: targetDiff
    };
  }

  getLatestWeight() {
    if (!this.weightHistory || this.weightHistory.length === 0) return null;
    return this.weightHistory[this.weightHistory.length - 1];
  }

  calculateBMI(weightKg) {
    const heightCm = parseFloat(this.prefs.heightCm);
    if (!weightKg || !heightCm || heightCm < 100 || heightCm > 250) {
      return null;
    }
    const heightM = heightCm / 100;
    const bmiVal = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

    let category = 'Normal';
    let colorVar = '--accent-work';
    if (bmiVal < 18.5) {
      category = 'Maigreur';
      colorVar = '--accent-rest';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      category = 'Surpoids';
      colorVar = '--accent-prep';
    } else if (bmiVal >= 30) {
      category = 'Obésité';
      colorVar = '--accent-danger';
    }

    return {
      value: bmiVal,
      category: category,
      colorVar: colorVar
    };
  }

  // --- Exportation & Importation de données ---
  exportJSON() {
    const backup = {
      app: 'FULL_BODY_17',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      profiles: this.profiles,
      activeProfileId: this.activeProfileId,
      prefs: this.prefs,
      history: this.history,
      badges: this.badges,
      weightHistory: this.weightHistory
    };
    return JSON.stringify(backup, null, 2);
  }

  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object' || !data.app || !data.history) {
        console.error('Import invalide : structure du fichier incorrecte.');
        return false;
      }
      if (data.app !== 'FULL_BODY_17') {
        console.error('Import invalide : ce fichier ne provient pas de Full Body 17.');
        return false;
      }
      if (!Array.isArray(data.history)) {
        console.error('Import invalide : historique manquant ou corrompu.');
        return false;
      }

      const validHistory = data.history.filter(session => {
        return session
          && typeof session.id === 'string'
          && typeof session.date === 'string'
          && typeof session.durationSeconds === 'number'
          && session.durationSeconds >= 0
          && session.durationSeconds <= 36000;
      });

      let validWeightHistory = [];
      if (Array.isArray(data.weightHistory)) {
        validWeightHistory = data.weightHistory.filter(entry => {
          return entry
            && typeof entry.date === 'string'
            && typeof entry.weight === 'number'
            && entry.weight >= 20
            && entry.weight <= 300;
        });
      }

      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        this.profiles = data.profiles;
        this.saveProfiles();
      }

      if (data.prefs && typeof data.prefs === 'object') {
        this.prefs = { ...DEFAULT_PREFERENCES, ...data.prefs };
      }
      this.history = validHistory;
      this.weightHistory = validWeightHistory;
      if (Array.isArray(data.badges)) {
        this.badges = data.badges.filter(b => typeof b === 'string');
      }

      localStorage.setItem(this.getPrefKey(), JSON.stringify(this.prefs));
      localStorage.setItem(this.getHistoryKey(), JSON.stringify(this.history));
      localStorage.setItem(this.getBadgesKey(), JSON.stringify(this.badges));
      localStorage.setItem(this.getWeightKey(), JSON.stringify(this.weightHistory));
      return true;
    } catch (e) {
      console.error('Erreur importation JSON:', e);
      return false;
    }
  }

  // --- Fusion intelligente des données locales et Cloud (Multi-Appareils) ---
  mergeData(remoteData) {
    if (!remoteData || typeof remoteData !== 'object') return false;

    let updated = false;

    // 1. Fusion des séances (par ID unique)
    if (Array.isArray(remoteData.history)) {
      const currentIds = new Set(this.history.map(s => s.id));
      remoteData.history.forEach(remSession => {
        if (remSession && remSession.id && !currentIds.has(remSession.id)) {
          this.history.push(remSession);
          currentIds.add(remSession.id);
          updated = true;
        }
      });
      this.history.sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
      localStorage.setItem(this.getHistoryKey(), JSON.stringify(this.history));
    }

    // 2. Fusion des pesées
    if (Array.isArray(remoteData.weightHistory)) {
      const localDates = new Map(this.weightHistory.map(w => [w.date, w]));
      remoteData.weightHistory.forEach(remW => {
        if (remW && remW.date) {
          const localW = localDates.get(remW.date);
          if (!localW) {
            this.weightHistory.push(remW);
            localDates.set(remW.date, remW);
            updated = true;
          } else if ((remW.timestamp || 0) > (localW.timestamp || 0)) {
            const idx = this.weightHistory.findIndex(w => w.date === remW.date);
            if (idx >= 0) this.weightHistory[idx] = remW;
            updated = true;
          }
        }
      });
      this.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      localStorage.setItem(this.getWeightKey(), JSON.stringify(this.weightHistory));
    }

    // 3. Fusion des badges
    if (Array.isArray(remoteData.badges)) {
      const mergedBadges = Array.from(new Set([...this.badges, ...remoteData.badges]));
      if (mergedBadges.length !== this.badges.length) {
        this.badges = mergedBadges;
        localStorage.setItem(this.getBadgesKey(), JSON.stringify(this.badges));
        updated = true;
      }
    }

    // 4. Fusion des réglages (sauf identifiants de synchro locaux si déjà présents)
    if (remoteData.prefs && typeof remoteData.prefs === 'object') {
      const { syncUserId, syncUserPin, syncAutoEnabled, syncLastTime, ...cleanRemotePrefs } = remoteData.prefs;
      this.prefs = { ...this.prefs, ...cleanRemotePrefs };
      localStorage.setItem(this.getPrefKey(), JSON.stringify(this.prefs));
      updated = true;
    }

    return updated;
  }

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.PREFS);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.WEIGHT);
    this.profiles = [{ id: 'default', name: 'Moi', avatar: '🦁', level: 'intermediate', createdAt: Date.now() }];
    this.activeProfileId = 'default';
    this.prefs = { ...DEFAULT_PREFERENCES };
    this.history = [];
    this.badges = [];
    this.weightHistory = [];
  }
}

window.appStorage = new AppStorage();
