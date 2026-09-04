/**
 * FULL BODY 17 — INTERNATIONALIZATION MODULE
 * Multi-language support for UI text, labels, and messages
 * @module i18n
 */

/**
 * @typedef {Object} TranslationStrings
 * @property {string} locale - Language code (fr, en, es, etc.)
 * @property {Object.<string, string|Object>} strings - Translation keys and values
 */

/**
 * I18n Manager — Handles multi-language translations
 * @class
 */
class I18nManager {
  constructor() {
    /** @type {string} */
    this.currentLocale = this._detectLocale();

    /** @type {Object.<string, TranslationStrings>} */
    this.translations = {};

    /** @type {TranslationStrings|null} */
    this.currentTranslation = null;

    this._registerDefaultTranslations();
    this.setLocale(this.currentLocale);
  }

  /**
   * Detect user's preferred language
   * @private
   * @returns {string} Locale code
   */
  _detectLocale() {
    // Check localStorage first
    const saved = localStorage.getItem('fb17_locale');
    if (saved) return saved;

    // Check browser language
    const browserLocale = navigator.language?.split('-')[0] || 'en';
    return ['fr', 'en', 'es', 'de', 'it', 'pt'].includes(browserLocale) ? browserLocale : 'en';
  }

  /**
   * Register default translations (French, English)
   * @private
   */
  _registerDefaultTranslations() {
    // French translations
    this.registerLocale('fr', {
      // Home / Navigation
      'nav.home': 'Accueil',
      'nav.workout': 'Séance',
      'nav.dashboard': 'Tableau de bord',
      'nav.badges': 'Badges',
      'nav.settings': 'Réglages',

      // Home screen
      'home.title': 'FULL BODY 17',
      'home.subtitle': 'Routine quotidienne 15-20 min',
      'home.start': 'Démarrer la séance',
      'home.countdown': 'Prochaine séance dans',
      'home.completed': '✅ Séance du jour accomplie !',
      'home.time': "C'est l'heure de votre séance !",
      'home.pending': '⏰ Séance en attente aujourd\'hui',

      // Difficulty levels
      'level.beginner': '🟢 Débutant',
      'level.intermediate': '🟡 Intermédiaire',
      'level.advanced': '🔴 Avancé',
      'level.custom': '✨ Sur-mesure',

      // Workout
      'workout.round': 'Tour',
      'workout.exercise': 'Exercice',
      'workout.work': 'Effort',
      'workout.rest': 'Repos',
      'workout.pause': 'Pause',
      'workout.resume': 'Reprendre',
      'workout.stop': 'Arrêter',
      'workout.completed': 'Séance terminée !',
      'workout.duration': 'Durée',

      // Dashboard
      'dashboard.title': 'Tableau de bord',
      'dashboard.stats': 'Statistiques',
      'dashboard.thisWeek': 'Cette semaine',
      'dashboard.allTime': 'Tous les temps',
      'dashboard.streak': 'Série',
      'dashboard.bestStreak': 'Meilleure série',
      'dashboard.sessions': 'Séances complétées',
      'dashboard.totalTime': 'Temps total',
      'dashboard.calories': 'Calories brûlées',

      // Badges
      'badges.title': 'Réalisations',
      'badges.unlock': 'Débloqué',
      'badges.locked': 'Verrouillé',
      'badges.first': 'Première séance',
      'badges.week': 'Une semaine complète',
      'badges.month': 'Un mois complet',

      // Settings
      'settings.title': 'Réglages',
      'settings.profile': 'Profil',
      'settings.name': 'Nom',
      'settings.avatar': 'Avatar',
      'settings.level': 'Niveau de difficulté',
      'settings.theme': 'Thème',
      'settings.language': 'Langue',
      'settings.sound': 'Sons',
      'settings.voice': 'Guidage vocal',
      'settings.music': 'Musique',
      'settings.reminder': 'Rappels',
      'settings.sync': 'Synchronisation cloud',

      // Notifications
      'notify.success': 'Succès !',
      'notify.error': 'Erreur',
      'notify.warning': 'Attention',
      'notify.reminder': 'N\'oubliez pas votre séance à',

      // Messages
      'msg.saved': 'Sauvegardé avec succès',
      'msg.error': 'Une erreur s\'est produite',
      'msg.offline': 'Mode hors ligne',
      'msg.syncing': 'Synchronisation...',
      'msg.syncFailed': 'Impossible de synchroniser les données'
    });

    // English translations
    this.registerLocale('en', {
      'nav.home': 'Home',
      'nav.workout': 'Workout',
      'nav.dashboard': 'Dashboard',
      'nav.badges': 'Badges',
      'nav.settings': 'Settings',

      'home.title': 'FULL BODY 17',
      'home.subtitle': 'Daily 15-20 min routine',
      'home.start': 'Start workout',
      'home.countdown': 'Next workout in',
      'home.completed': '✅ Today\'s session complete!',
      'home.time': 'Time for your workout!',
      'home.pending': '⏰ Workout pending today',

      'level.beginner': '🟢 Beginner',
      'level.intermediate': '🟡 Intermediate',
      'level.advanced': '🔴 Advanced',
      'level.custom': '✨ Custom',

      'workout.round': 'Round',
      'workout.exercise': 'Exercise',
      'workout.work': 'Work',
      'workout.rest': 'Rest',
      'workout.pause': 'Pause',
      'workout.resume': 'Resume',
      'workout.stop': 'Stop',
      'workout.completed': 'Workout complete!',
      'workout.duration': 'Duration',

      'dashboard.title': 'Dashboard',
      'dashboard.stats': 'Statistics',
      'dashboard.thisWeek': 'This week',
      'dashboard.allTime': 'All time',
      'dashboard.streak': 'Streak',
      'dashboard.bestStreak': 'Best streak',
      'dashboard.sessions': 'Sessions completed',
      'dashboard.totalTime': 'Total time',
      'dashboard.calories': 'Calories burned',

      'badges.title': 'Achievements',
      'badges.unlock': 'Unlocked',
      'badges.locked': 'Locked',
      'badges.first': 'First workout',
      'badges.week': 'Full week',
      'badges.month': 'Full month',

      'settings.title': 'Settings',
      'settings.profile': 'Profile',
      'settings.name': 'Name',
      'settings.avatar': 'Avatar',
      'settings.level': 'Difficulty level',
      'settings.theme': 'Theme',
      'settings.language': 'Language',
      'settings.sound': 'Sounds',
      'settings.voice': 'Voice guidance',
      'settings.music': 'Music',
      'settings.reminder': 'Reminders',
      'settings.sync': 'Cloud sync',

      'notify.success': 'Success!',
      'notify.error': 'Error',
      'notify.warning': 'Warning',
      'notify.reminder': 'Don\'t forget your workout at',

      'msg.saved': 'Saved successfully',
      'msg.error': 'An error occurred',
      'msg.offline': 'Offline mode',
      'msg.syncing': 'Syncing...',
      'msg.syncFailed': 'Failed to sync data'
    });

    // Spanish translations (example)
    this.registerLocale('es', {
      'nav.home': 'Inicio',
      'nav.workout': 'Entrenamiento',
      'nav.dashboard': 'Panel de control',
      'nav.badges': 'Insignias',
      'nav.settings': 'Configuración',

      'home.title': 'FULL BODY 17',
      'home.subtitle': 'Rutina diaria de 15-20 minutos',
      'home.start': 'Iniciar entrenamiento',
      'home.countdown': 'Próximo entrenamiento en',
      'home.completed': '✅ ¡Sesión completada!',
      'home.time': '¡Es hora de tu entrenamiento!',
      'home.pending': '⏰ Entrenamiento pendiente hoy',

      'level.beginner': '🟢 Principiante',
      'level.intermediate': '🟡 Intermedio',
      'level.advanced': '🔴 Avanzado',
      'level.custom': '✨ Personalizado',

      'workout.round': 'Vuelta',
      'workout.exercise': 'Ejercicio',
      'workout.work': 'Trabajo',
      'workout.rest': 'Descanso',
      'workout.pause': 'Pausa',
      'workout.resume': 'Reanudar',
      'workout.stop': 'Parar',
      'workout.completed': '¡Entrenamiento completado!',
      'workout.duration': 'Duración',

      'dashboard.title': 'Panel de control',
      'dashboard.stats': 'Estadísticas',
      'dashboard.thisWeek': 'Esta semana',
      'dashboard.allTime': 'Todo el tiempo',
      'dashboard.streak': 'Racha',
      'dashboard.bestStreak': 'Mejor racha',
      'dashboard.sessions': 'Sesiones completadas',
      'dashboard.totalTime': 'Tiempo total',
      'dashboard.calories': 'Calorías quemadas',

      'badges.title': 'Logros',
      'badges.unlock': 'Desbloqueado',
      'badges.locked': 'Bloqueado',
      'badges.first': 'Primer entrenamiento',
      'badges.week': 'Semana completa',
      'badges.month': 'Mes completo',

      'settings.title': 'Configuración',
      'settings.profile': 'Perfil',
      'settings.name': 'Nombre',
      'settings.avatar': 'Avatar',
      'settings.level': 'Nivel de dificultad',
      'settings.theme': 'Tema',
      'settings.language': 'Idioma',
      'settings.sound': 'Sonidos',
      'settings.voice': 'Guía de voz',
      'settings.music': 'Música',
      'settings.reminder': 'Recordatorios',
      'settings.sync': 'Sincronización en la nube',

      'notify.success': '¡Éxito!',
      'notify.error': 'Error',
      'notify.warning': 'Advertencia',
      'notify.reminder': 'No olvides tu entrenamiento a',

      'msg.saved': 'Guardado exitosamente',
      'msg.error': 'Ocurrió un error',
      'msg.offline': 'Modo sin conexión',
      'msg.syncing': 'Sincronizando...',
      'msg.syncFailed': 'Error al sincronizar datos'
    });
  }

  /**
   * Register a new locale with translations
   * @param {string} locale - Locale code (e.g., 'fr', 'en')
   * @param {Object.<string, string>} strings - Translation key-value pairs
   */
  registerLocale(locale, strings) {
    this.translations[locale] = { locale, strings };
  }

  /**
   * Set active language/locale
   * @param {string} locale - Locale code
   * @returns {boolean} Success status
   */
  setLocale(locale) {
    if (!this.translations[locale]) {
      console.warn(`[i18n] Locale not found: ${locale}, falling back to 'en'`);
      locale = 'en';
    }

    this.currentLocale = locale;
    this.currentTranslation = this.translations[locale];

    try {
      localStorage.setItem('fb17_locale', locale);
    } catch (e) {
      console.warn('[i18n] Failed to save locale preference:', e.message);
    }

    // Dispatch custom event for listeners
    window.dispatchEvent(new CustomEvent('localeChanged', { detail: { locale } }));

    return true;
  }

  /**
   * Get translated string
   * @param {string} key - Translation key (e.g., 'home.title')
   * @param {Object} [params={}] - Template parameters for dynamic strings
   * @returns {string} Translated string
   */
  t(key, params = {}) {
    if (!this.currentTranslation) {
      return key;
    }

    let translation = this.currentTranslation.strings[key];

    if (!translation) {
      console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }

    // Replace parameters if provided
    Object.entries(params).forEach(([param, value]) => {
      translation = translation.replace(`{${param}}`, value);
    });

    return translation;
  }

  /**
   * Get translation or fallback to key
   * @param {string} key - Translation key
   * @returns {string} Translated string
   */
  $(key) {
    return this.t(key);
  }

  /**
   * Get available locales
   * @returns {string[]} Array of locale codes
   */
  getAvailableLocales() {
    return Object.keys(this.translations);
  }

  /**
   * Get current locale
   * @returns {string} Current locale code
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Add language to UI select (for settings)
   * @returns {Array<{value: string, label: string}>} Locale options
   */
  getLocaleOptions() {
    const names = {
      fr: 'Français',
      en: 'English',
      es: 'Español',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português'
    };

    return this.getAvailableLocales().map(locale => ({
      value: locale,
      label: names[locale] || locale.toUpperCase()
    }));
  }

  /**
   * Translate entire HTML element and descendants
   * @param {Element} element - DOM element to translate
   */
  translateElement(element) {
    // Find all elements with data-i18n attribute
    element.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const attr = el.getAttribute('data-i18n-attr') || 'textContent';

      const translated = this.t(key);
      el.setAttribute(attr, translated);
    });
  }

  /**
   * Format a date string based on current locale
   * @param {Date} date - Date to format
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Format a time duration (e.g., "2h 30m")
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

// Global instance
window.i18n = new I18nManager();

// Helper function for shorthand translations
window.__ = (key, params) => window.i18n.t(key, params);
