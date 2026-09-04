/**
 * FULL BODY 17 — ENHANCED STORAGE MODULE WITH TYPE HINTS
 * Multi-user profile management, LocalStorage persistence, and error tracking
 * @module storage
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - Unique profile identifier
 * @property {string} name - Display name
 * @property {string} avatar - Emoji avatar
 * @property {string} level - Difficulty level (beginner|intermediate|advanced|custom)
 * @property {number} createdAt - Unix timestamp
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} userName - Display name
 * @property {string} userAvatar - Emoji avatar
 * @property {string} userLevel - Difficulty level
 * @property {number[]|null} customExerciseIds - Custom exercise list (if custom mode)
 * @property {number} rounds - Number of workout rounds
 * @property {number} workDuration - Work phase duration (seconds)
 * @property {number} restDuration - Rest phase duration (seconds)
 * @property {number} plankDuration - Plank exercise duration (seconds)
 * @property {string} targetTime - Target workout time (HH:MM format)
 * @property {number|null} targetWeight - Target body weight (kg)
 * @property {number|null} initialWeight - Starting body weight (kg)
 * @property {number|null} heightCm - Height in centimeters
 * @property {boolean} soundEnabled - Sound effects enabled
 * @property {boolean} voiceEnabled - Voice cues enabled
 * @property {boolean} musicEnabled - Background music enabled
 * @property {number} musicVolume - Music volume (0-1)
 * @property {string} musicStyle - Music style (synthwave|electro|chill)
 * @property {string} theme - UI theme (dark|light|system)
 * @property {boolean} reminderActive - Workout reminders enabled
 * @property {string} firebaseUrl - Firebase database URL
 * @property {string} firebaseAuthToken - Firebase auth token
 * @property {string} syncUserId - Cloud sync user ID
 * @property {string} syncUserPin - Cloud sync PIN
 * @property {boolean} syncAutoEnabled - Auto-sync on startup
 * @property {string|null} syncLastTime - Last sync timestamp (ISO format)
 */

/**
 * @typedef {Object} WorkoutSession
 * @property {string} date - Session date (YYYY-MM-DD)
 * @property {string} startTime - Start time (HH:MM:SS)
 * @property {number} duration - Total duration (seconds)
 * @property {number} rounds - Rounds completed
 * @property {number[]} exerciseIds - Exercises performed
 * @property {number} caloriesEstimate - Estimated calories burned
 */

/**
 * @typedef {Object} StreakStats
 * @property {boolean} doneToday - Workout completed today
 * @property {number} currentStreak - Current streak count
 * @property {number} bestStreak - Best streak achieved
 * @property {string} lastWorkoutDate - Last completed workout date
 */

const STORAGE_KEYS = {
  PROFILES: 'fb17_profiles',
  ACTIVE_PROFILE: 'fb17_active_profile_id',
  PREFS: 'fb17_preferences',
  HISTORY: 'fb17_workout_history',
  BADGES: 'fb17_unlocked_badges',
  WEIGHT: 'fb17_weight_history'
};

/**
 * @type {UserPreferences}
 */
const DEFAULT_PREFERENCES = {
  userName: "Moi",
  userAvatar: "🦁",
  userLevel: "intermediate", // "beginner" | "intermediate" | "advanced" | "custom"
  customExerciseIds: null, // Array of IDs for custom mode
  rounds: 3,
  workDuration: 40,
  restDuration: 20,
  plankDuration: 45, // 30, 45, 60, 120 (2 min)
  targetTime: "17:00",
  targetWeight: null, // Target weight in kg
  initialWeight: null, // Starting weight in kg
  heightCm: null, // Height in cm for BMI calculation
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

/**
 * AppStorage — Central storage manager with multi-profile support
 * @class
 */
class AppStorage {
  /**
   * Initialize storage from LocalStorage
   * @constructor
   */
  constructor() {
    /** @type {UserProfile[]} */
    this.profiles = this.loadProfiles();

    /** @type {string} */
    this.activeProfileId = this.loadActiveProfileId();

    this.ensureActiveProfileExists();

    /** @type {UserPreferences} */
    this.prefs = this.loadPreferences();

    /** @type {WorkoutSession[]} */
    this.history = this.loadHistory();

    /** @type {string[]} */
    this.badges = this.loadBadges();

    /** @type {Array<{date: string, weight: number}>} */
    this.weightHistory = this.loadWeightHistory();
  }

  // --- Multi-Profile Key Management ---

  /**
   * Get LocalStorage key for preferences
   * @param {string} [profileId] - Profile ID (defaults to active)
   * @returns {string} Storage key
   */
  getPrefKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') 
      ? STORAGE_KEYS.PREFS 
      : `fb17_prof_${profileId}_preferences`;
  }

  /**
   * Get LocalStorage key for workout history
   * @param {string} [profileId] - Profile ID (defaults to active)
   * @returns {string} Storage key
   */
  getHistoryKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') 
      ? STORAGE_KEYS.HISTORY 
      : `fb17_prof_${profileId}_history`;
  }

  /**
   * Get LocalStorage key for badges
   * @param {string} [profileId] - Profile ID (defaults to active)
   * @returns {string} Storage key
   */
  getBadgesKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') 
      ? STORAGE_KEYS.BADGES 
      : `fb17_prof_${profileId}_badges`;
  }

  /**
   * Get LocalStorage key for weight history
   * @param {string} [profileId] - Profile ID (defaults to active)
   * @returns {string} Storage key
   */
  getWeightKey(profileId = this.activeProfileId) {
    return (!profileId || profileId === 'default') 
      ? STORAGE_KEYS.WEIGHT 
      : `fb17_prof_${profileId}_weight`;
  }

  // --- Profile Management ---

  /**
   * Load all user profiles from LocalStorage
   * @returns {UserProfile[]} Array of profiles
   */
  loadProfiles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[AppStorage] Error loading profiles:', e.message);
    }

    // Return default profile if none found
    const defaultProfile = {
      id: 'default',
      name: 'Moi',
      avatar: '🦁',
      level: 'intermediate',
      createdAt: Date.now()
    };
    return [defaultProfile];
  }

  /**
   * Persist profiles to LocalStorage
   * @returns {boolean} Success status
   */
  saveProfiles() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(this.profiles));
      return true;
    } catch (e) {
      console.error('[AppStorage] Error saving profiles:', e.message);
      return false;
    }
  }

  /**
   * Get active profile object
   * @returns {UserProfile|null} Active profile
   */
  getActiveProfile() {
    return this.profiles.find(p => p.id === this.activeProfileId) || null;
  }

  /**
   * Create new user profile
   * @param {string} name - Profile name
   * @param {string} [avatar='🦁'] - Emoji avatar
   * @returns {UserProfile} New profile
   */
  createProfile(name, avatar = '🦁') {
    const profile = {
      id: `prof_${Date.now()}`,
      name,
      avatar,
      level: 'intermediate',
      createdAt: Date.now()
    };
    this.profiles.push(profile);
    this.saveProfiles();
    return profile;
  }

  /**
   * Switch to different user profile
   * @param {string} profileId - Profile ID to switch to
   * @returns {boolean} Success status
   */
  switchProfile(profileId) {
    if (!this.profiles.find(p => p.id === profileId)) {
      console.warn('[AppStorage] Profile not found:', profileId);
      return false;
    }
    this.activeProfileId = profileId;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, profileId);
      this.prefs = this.loadPreferences();
      this.history = this.loadHistory();
      this.badges = this.loadBadges();
      return true;
    } catch (e) {
      console.error('[AppStorage] Error switching profile:', e.message);
      return false;
    }
  }

  // --- Preference Management ---

  /**
   * Load user preferences for active profile
   * @returns {UserPreferences} User preferences
   */
  loadPreferences() {
    try {
      const key = this.getPrefKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[AppStorage] Error loading preferences:', e.message);
    }
    return { ...DEFAULT_PREFERENCES };
  }

  /**
   * Save user preferences
   * @param {Partial<UserPreferences>} updates - Preferences to update
   * @returns {boolean} Success status
   */
  savePreferences(updates) {
    try {
      this.prefs = { ...this.prefs, ...updates };
      const key = this.getPrefKey();
      localStorage.setItem(key, JSON.stringify(this.prefs));
      return true;
    } catch (e) {
      console.error('[AppStorage] Error saving preferences:', e.message);
      return false;
    }
  }

  // --- Workout History ---

  /**
   * Load workout session history for active profile
   * @returns {WorkoutSession[]} Array of completed sessions
   */
  loadHistory() {
    try {
      const key = this.getHistoryKey();
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[AppStorage] Error loading history:', e.message);
      return [];
    }
  }

  /**
   * Add completed workout session to history
   * @param {WorkoutSession} session - Session data
   * @returns {boolean} Success status
   */
  addSession(session) {
    try {
      this.history.push({
        date: new Date().toISOString().split('T')[0],
        ...session
      });
      const key = this.getHistoryKey();
      localStorage.setItem(key, JSON.stringify(this.history));
      return true;
    } catch (e) {
      console.error('[AppStorage] Error adding session:', e.message);
      return false;
    }
  }

  /**
   * Get streak statistics (consecutive days)
   * @returns {StreakStats} Streak information
   */
  getStreakStats() {
    const today = new Date().toISOString().split('T')[0];
    const doneToday = this.history.some(s => s.date === today);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastDate = null;

    [...this.history].reverse().forEach(session => {
      const sessionDate = session.date;
      if (!lastDate) {
        if (sessionDate === today) {
          tempStreak = 1;
        } else {
          lastDate = sessionDate;
          tempStreak = 1;
        }
      } else {
        const lastDateObj = new Date(lastDate);
        const sessionDateObj = new Date(sessionDate);
        const daysDiff = (lastDateObj - sessionDateObj) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          break;
        }
      }
      lastDate = sessionDate;
    });

    if (doneToday) {
      currentStreak = tempStreak;
    } else if (tempStreak > 0) {
      // Streak broken yesterday
      currentStreak = 0;
    }

    this.history.forEach(session => {
      // Calculate best streak from entire history
      const count = this.history.filter(s => s.date <= session.date).length;
      bestStreak = Math.max(bestStreak, count);
    });

    return {
      doneToday,
      currentStreak,
      bestStreak,
      lastWorkoutDate: this.history[this.history.length - 1]?.date || null
    };
  }

  // --- Additional Helpers ---

  /**
   * Ensure active profile exists
   * @private
   */
  ensureActiveProfileExists() {
    const exists = this.profiles.some(p => p.id === this.activeProfileId);
    if (!exists && this.profiles.length > 0) {
      this.activeProfileId = this.profiles[0].id;
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, this.activeProfileId);
      } catch (e) {
        console.warn('[AppStorage] Error setting active profile:', e.message);
      }
    }
  }

  /**
   * Load active profile ID
   * @private
   * @returns {string} Active profile ID
   */
  loadActiveProfileId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE) || 'default';
    } catch (e) {
      return 'default';
    }
  }

  /**
   * Load unlocked badges
   * @private
   * @returns {string[]} Array of badge IDs
   */
  loadBadges() {
    try {
      const key = this.getBadgesKey();
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[AppStorage] Error loading badges:', e.message);
      return [];
    }
  }

  /**
   * Load weight history
   * @private
   * @returns {Array<{date: string, weight: number}>} Weight entries
   */
  loadWeightHistory() {
    try {
      const key = this.getWeightKey();
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[AppStorage] Error loading weight history:', e.message);
      return [];
    }
  }
}

// Global instance
window.appStorage = new AppStorage();
