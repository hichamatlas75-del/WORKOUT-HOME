/**
 * FULL BODY 17 — APPLICATION MANAGER
 * Centralized initialization & error tracking for all app modules
 * @module appManager
 */

/**
 * Structured error logging with recovery strategy
 * @typedef {Object} AppError
 * @property {string} module - Module name that threw error
 * @property {Error} error - Original error object
 * @property {string} severity - 'warn' | 'error' | 'critical'
 * @property {timestamp} timestamp - Error time
 * @property {string} recovery - Recovery action taken
 */

class AppErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
  }

  /**
   * Log an application error with structured metadata
   * @param {string} module - Module name
   * @param {Error} error - Error object
   * @param {string} [severity='warn'] - Error severity level
   * @param {string} [recovery=''] - Recovery action taken
   */
  logError(module, error, severity = 'warn', recovery = '') {
    const errorRecord = {
      module,
      message: error?.message || String(error),
      stack: error?.stack || '',
      severity,
      timestamp: new Date().toISOString(),
      recovery,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorRecord);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Only log to console for critical errors or dev mode
    if (severity === 'critical' || localStorage.getItem('DEBUG_MODE')) {
      console.error(`[${module}]`, error);
    }

    // Notify user of critical errors
    if (severity === 'critical' && window.notificationManager) {
      window.notificationManager.showError(
        `Une erreur s'est produite: ${module}`,
        errorRecord.message
      );
    }

    return errorRecord;
  }

  /**
   * Get recent errors for debugging
   * @param {number} [count=10] - Number of recent errors to return
   * @returns {Array<AppError>}
   */
  getRecent(count = 10) {
    return this.errors.slice(-count);
  }

  /**
   * Export errors for diagnostics
   * @returns {string} JSON string of errors
   */
  export() {
    return JSON.stringify(this.errors, null, 2);
  }
}

class AppManager {
  constructor() {
    this.errorTracker = new AppErrorTracker();
    this.initialized = false;
    this.modules = {
      theme: false,
      settings: false,
      exercises: false,
      navigation: false,
      workout: false,
      clock: false,
      notifications: false,
      dashboard: false,
      badges: false,
      urlParams: false,
      sync: false
    };
  }

  /**
   * Main initialization sequence - consolidated from 10 separate steps
   * @returns {Promise<boolean>} Success status
   */
  async init() {
    if (this.initialized) {
      console.warn('AppManager already initialized');
      return true;
    }

    const initSteps = [
      { id: 'theme', fn: () => this._initTheme(), critical: true },
      { id: 'settings', fn: () => this._initSettings(), critical: false },
      { id: 'exercises', fn: () => this._initExercises(), critical: false },
      { id: 'navigation', fn: () => this._initNavigation(), critical: true },
      { id: 'workout', fn: () => this._initWorkoutUI(), critical: false },
      { id: 'clock', fn: () => this._initClock(), critical: false },
      { id: 'notifications', fn: () => this._initNotifications(), critical: false },
      { id: 'dashboard', fn: () => this._initDashboard(), critical: false },
      { id: 'badges', fn: () => this._initBadges(), critical: false },
      { id: 'urlParams', fn: () => this._handleUrlParams(), critical: false },
      { id: 'sync', fn: () => this._initSync(), critical: false }
    ];

    for (const step of initSteps) {
      try {
        await step.fn();
        this.modules[step.id] = true;
      } catch (error) {
        const severity = step.critical ? 'error' : 'warn';
        this.errorTracker.logError(
          `App.${step.id}`,
          error,
          severity,
          `Skipped ${step.id} init`
        );

        if (step.critical) {
          console.error(`Critical init failure: ${step.id}`, error);
          return false;
        }
      }
    }

    this.initialized = true;
    return true;
  }

  /**
   * Initialize theme with system preference detection
   * @private
   */
  _initTheme() {
    const savedTheme = window.appStorage?.prefs?.theme || 'dark';
    const resolvedTheme = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;

    document.documentElement.setAttribute('data-theme', resolvedTheme);

    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) themeSelect.value = savedTheme;

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (window.appStorage?.prefs?.theme === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  /**
   * Load settings form and avatar
   * @private
   */
  _initSettings() {
    if (typeof loadSettingsForm === 'function') {
      loadSettingsForm();
    }
    if (typeof updateAvatarDisplay === 'function') {
      updateAvatarDisplay();
    }
  }

  /**
   * Render home exercises list
   * @private
   */
  _initExercises() {
    if (typeof renderHomeExercisesList === 'function') {
      renderHomeExercisesList();
    }
  }

  /**
   * Initialize tab navigation
   * @private
   */
  _initNavigation() {
    if (typeof initTabNavigation === 'function') {
      initTabNavigation();
    }
  }

  /**
   * Initialize workout UI listeners
   * @private
   */
  _initWorkoutUI() {
    if (typeof initWorkoutUI === 'function') {
      initWorkoutUI();
    }
  }

  /**
   * Start 17:00 countdown clock
   * @private
   */
  _initClock() {
    if (typeof startLiveClock === 'function') {
      startLiveClock();
    }
  }

  /**
   * Start reminder watcher
   * @private
   */
  _initNotifications() {
    if (window.notificationManager?.startReminderWatcher) {
      window.notificationManager.startReminderWatcher();
    }
  }

  /**
   * Render dashboard
   * @private
   */
  _initDashboard() {
    if (window.dashboardManager?.renderDashboard) {
      window.dashboardManager.renderDashboard();
    }
  }

  /**
   * Render badges view
   * @private
   */
  _initBadges() {
    if (window.motivationManager?.renderBadgesView) {
      window.motivationManager.renderBadgesView();
    }
  }

  /**
   * Handle URL parameters (?action=start, ?tab=...)
   * @private
   */
  _handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('action') === 'start') {
      if (typeof startWorkoutSession === 'function') {
        startWorkoutSession();
      }
    } else if (urlParams.get('tab')) {
      if (typeof switchTab === 'function') {
        switchTab(urlParams.get('tab'));
      }
    }
  }

  /**
   * Auto-sync profile if enabled
   * @private
   */
  _initSync() {
    if (window.syncManager && window.appStorage?.prefs?.syncUserId && window.appStorage?.prefs?.syncAutoEnabled) {
      window.syncManager.sync({ silent: true });
    }
  }

  /**
   * Get initialization status summary
   * @returns {Object} Module status object
   */
  getStatus() {
    return {
      initialized: this.initialized,
      modules: this.modules,
      errors: this.errorTracker.getRecent(5)
    };
  }
}

// Global instance
window.appManager = new AppManager();
window.appErrorTracker = window.appManager.errorTracker;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.appManager.init().catch(err => {
      console.error('App initialization failed:', err);
    });
  });
} else {
  window.appManager.init().catch(err => {
    console.error('App initialization failed:', err);
  });
}
