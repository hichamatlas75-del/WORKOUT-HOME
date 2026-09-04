/**
 * FULL BODY 17 — SETTINGS PERSISTENCE MODULE
 * Auto-save settings with better error handling & visual feedback
 * @module settingsPersistence
 */

class SettingsPersistenceManager {
  constructor() {
    this.debounceTimer = null;
    this.debounceDelay = 800; // 800ms
    this.lastSavedValues = {};
    this.saveInProgress = false;
    this.initSettingsListeners();
  }

  /**
   * Initialize all settings form event listeners
   * @private
   */
  initSettingsListeners() {
    // Handle both cases: script loads before or after DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this._attachListeners(), 100);
      });
    } else {
      // DOM already loaded, attach immediately
      setTimeout(() => this._attachListeners(), 100);
    }
  }

  /**
   * Attach listeners to all settings form elements
   * @private
   */
  _attachListeners() {
    const settingIds = [
      'setting-target-time',
      'setting-rounds',
      'setting-plank-duration',
      'setting-work-duration',
      'setting-rest-duration',
      'setting-sound',
      'setting-voice',
      'setting-music',
      'setting-music-style',
      'setting-music-volume',
      'setting-reminder',
      'setting-theme',
      'setting-initial-weight',
      'setting-target-weight',
      'setting-height-cm',
      'setting-firebase-url',
      'sync-user-id',
      'sync-user-pin',
      'sync-auto-enabled'
    ];

    settingIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;

      // Auto-save on change (debounced)
      element.addEventListener('change', () => {
        this.scheduleAutoSave();
      });

      // Also listen to input for real-time feedback
      element.addEventListener('input', () => {
        this.scheduleAutoSave();
      });

      // Mark as modified
      element.addEventListener('change', () => {
        this._markFormModified(true);
      });
    });

    // Initialize lastSavedValues with current form state
    const result = this._collectFormValues();
    if (result.success) {
      this.lastSavedValues = { ...result.prefs };
    }

    console.log('[Settings] Event listeners attached to all form elements');
  }

  /**
   * Schedule auto-save with debounce (wait until user stops changing)
   * @private
   */
  scheduleAutoSave() {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Mark form as modified
    this._markFormModified(true);

    // Schedule new save
    this.debounceTimer = setTimeout(() => {
      this.performAutoSave();
    }, this.debounceDelay);
  }

  /**
   * Perform the actual auto-save operation
   * @private
   */
  performAutoSave() {
    if (this.saveInProgress) return;

    try {
      this.saveInProgress = true;
      const result = this._collectFormValues();

      if (!result.success) {
        console.warn('[Settings] Form validation failed:', result.error);
        this._showSaveStatus('error', 'Validation échouée');
        return;
      }

      const newPrefs = result.prefs;

      // Check if values actually changed
      if (!this._hasValuesChanged(newPrefs)) {
        console.log('[Settings] No changes detected');
        return;
      }

      // Save to AppStorage
      if (!window.appStorage) {
        console.error('[Settings] AppStorage not available');
        this._showSaveStatus('error', 'Erreur de stockage');
        return;
      }

      const saveSuccess = window.appStorage.savePreferences(newPrefs);

      if (saveSuccess === false) {
        throw new Error('localStorage.setItem failed');
      }

      // Update UI
      this._applyPreferencesToUI(newPrefs);

      // Show success
      this._showSaveStatus('success', 'Réglages enregistrés');
      this._markFormModified(false);
      this.lastSavedValues = { ...newPrefs };

      console.log('[Settings] Auto-saved successfully', newPrefs);
    } catch (error) {
      console.error('[Settings] Auto-save failed:', error);
      this._showSaveStatus('error', `Erreur: ${error.message}`);

      // Log to error tracker if available
      if (window.appErrorTracker) {
        window.appErrorTracker.logError(
          'SettingsPersistence.autoSave',
          error,
          'error',
          'Auto-save of settings failed'
        );
      }
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Collect all form values
   * @private
   * @returns {Object} { success: boolean, prefs: Object, error: string }
   */
  _collectFormValues() {
    try {
      const timeInput = document.getElementById('setting-target-time');
      const roundsInput = document.getElementById('setting-rounds');
      const plankInput = document.getElementById('setting-plank-duration');
      const workInput = document.getElementById('setting-work-duration');
      const restInput = document.getElementById('setting-rest-duration');
      const soundSwitch = document.getElementById('setting-sound');
      const voiceSwitch = document.getElementById('setting-voice');
      const musicSwitch = document.getElementById('setting-music');
      const musicStyleSelect = document.getElementById('setting-music-style');
      const musicVolumeSlider = document.getElementById('setting-music-volume');
      const reminderSwitch = document.getElementById('setting-reminder');
      const themeSelect = document.getElementById('setting-theme');
      const initWeightInput = document.getElementById('setting-initial-weight');
      const targetWeightInput = document.getElementById('setting-target-weight');
      const heightInput = document.getElementById('setting-height-cm');
      const firebaseUrlInput = document.getElementById('setting-firebase-url');
      const syncIdInput = document.getElementById('sync-user-id');
      const syncPinInput = document.getElementById('sync-user-pin');
      const syncAutoSwitch = document.getElementById('sync-auto-enabled');

      const prefs = {
        targetTime: timeInput?.value || '17:00',
        rounds: roundsInput ? Math.min(4, Math.max(2, parseInt(roundsInput.value) || 3)) : 3,
        plankDuration: plankInput ? parseInt(plankInput.value) || 45 : 45,
        workDuration: workInput ? Math.min(90, Math.max(20, parseInt(workInput.value) || 40)) : 40,
        restDuration: restInput ? Math.min(60, Math.max(10, parseInt(restInput.value) || 20)) : 20,
        soundEnabled: soundSwitch?.checked ?? true,
        voiceEnabled: voiceSwitch?.checked ?? true,
        musicEnabled: musicSwitch?.checked ?? true,
        musicStyle: musicStyleSelect?.value || 'synthwave',
        musicVolume: musicVolumeSlider ? (parseInt(musicVolumeSlider.value) / 100) : 0.6,
        reminderActive: reminderSwitch?.checked ?? true,
        theme: themeSelect?.value || 'dark',
        initialWeight: initWeightInput?.value ? parseFloat(initWeightInput.value) : null,
        targetWeight: targetWeightInput?.value ? parseFloat(targetWeightInput.value) : null,
        heightCm: heightInput?.value ? parseInt(heightInput.value) : null,
        firebaseUrl: firebaseUrlInput?.value?.trim() || '',
        syncUserId: syncIdInput?.value?.trim().toLowerCase() || '',
        syncUserPin: syncPinInput?.value?.trim() || '',
        syncAutoEnabled: syncAutoSwitch?.checked ?? true
      };

      return { success: true, prefs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if values have actually changed
   * @private
   * @param {Object} newPrefs - New preference values
   * @returns {boolean} True if values changed
   */
  _hasValuesChanged(newPrefs) {
    if (Object.keys(this.lastSavedValues).length === 0) {
      // First time saving
      return true;
    }

    for (const [key, value] of Object.entries(newPrefs)) {
      if (this.lastSavedValues[key] !== value) {
        return true;
      }
    }

    return false;
  }

  /**
   * Apply preferences to UI (theme, audio, etc.)
   * @private
   * @param {Object} prefs - Preferences object
   */
  _applyPreferencesToUI(prefs) {
    // Apply theme
    if (prefs.theme) {
      const resolvedTheme = prefs.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : prefs.theme;
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    }

    // Apply audio settings
    if (window.audioEngine) {
      window.audioEngine.soundEnabled = prefs.soundEnabled ?? true;
      window.audioEngine.voiceEnabled = prefs.voiceEnabled ?? true;

      if (window.audioEngine.musicEngine) {
        window.audioEngine.musicEngine.enabled = prefs.musicEnabled ?? true;
        window.audioEngine.musicEngine.setVolume(prefs.musicVolume ?? 0.6);
        window.audioEngine.musicEngine.setStyle(prefs.musicStyle || 'synthwave');
      }
    }

    // Update sync manager UI
    if (window.syncManager) {
      window.syncManager.updateStatusUI();
    }
  }

  /**
   * Mark form as modified/clean
   * @private
   * @param {boolean} modified - Is form modified?
   */
  _markFormModified(modified) {
    const settingsView = document.getElementById('view-settings');
    if (!settingsView) return;

    if (modified) {
      settingsView.classList.add('has-unsaved-changes');
    } else {
      settingsView.classList.remove('has-unsaved-changes');
    }
  }

  /**
   * Show visual save status feedback
   * @private
   * @param {string} status - 'success' | 'error' | 'saving'
   * @param {string} message - Status message
   */
  _showSaveStatus(status, message) {
    // Try to find or create status element
    let statusEl = document.getElementById('settings-save-status');

    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'settings-save-status';
      statusEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
      `;
      document.body.appendChild(statusEl);
    }

    // Set styles based on status
    const styles = {
      success: {
        background: 'rgba(34, 197, 94, 0.95)',
        color: '#fff'
      },
      error: {
        background: 'rgba(239, 68, 68, 0.95)',
        color: '#fff'
      },
      saving: {
        background: 'rgba(59, 130, 246, 0.95)',
        color: '#fff'
      }
    };

    const style = styles[status] || styles.saving;
    statusEl.style.background = style.background;
    statusEl.style.color = style.color;
    statusEl.textContent = message;

    // Auto-hide after 3 seconds (unless error)
    if (this.statusTimeout) clearTimeout(this.statusTimeout);

    if (status !== 'error') {
      this.statusTimeout = setTimeout(() => {
        statusEl.style.opacity = '0';
        statusEl.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
          statusEl.style.display = 'none';
        }, 300);
      }, 3000);
    }
  }

  /**
   * Manual save (called by existing button)
   * Used when user clicks "Save" button explicitly
   */
  manualSave() {
    console.log('[Settings] Manual save triggered');
    this.performAutoSave();
  }

  /**
   * Reset form to current saved values
   */
  resetForm() {
    if (typeof loadSettingsForm === 'function') {
      loadSettingsForm();
      this._markFormModified(false);
      console.log('[Settings] Form reset to saved values');
    }
  }

  /**
   * Get current form state
   * @returns {Object} Current form preferences
   */
  getCurrentFormState() {
    const result = this._collectFormValues();
    return result.success ? result.prefs : null;
  }

  /**
   * Verify settings are saved (for debugging)
   * @returns {Object} Comparison of form vs storage
   */
  debugVerifySaved() {
    const formState = this.getCurrentFormState();
    const storageState = window.appStorage?.prefs || {};

    const comparison = {
      match: true,
      differences: []
    };

    if (!formState) {
      return { error: 'Could not read form state' };
    }

    for (const [key, formValue] of Object.entries(formState)) {
      const storageValue = storageState[key];
      if (formValue !== storageValue) {
        comparison.match = false;
        comparison.differences.push({
          key,
          formValue,
          storageValue
        });
      }
    }

    return comparison;
  }
}

// Global instance
window.settingsPersistence = new SettingsPersistenceManager();

// Override the existing saveSettings function to use the new manager
const originalSaveSettings = typeof saveSettings === 'function' ? saveSettings : null;

window.saveSettings = function() {
  console.log('[Settings] Save button clicked');
  window.settingsPersistence.manualSave();
};

console.log('[Settings Persistence] Module loaded - auto-save enabled');
