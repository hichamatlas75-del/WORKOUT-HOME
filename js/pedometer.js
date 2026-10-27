/**
 * FULL BODY 17 — PODOMÈTRE & COMPTEUR DE CALORIES COMBINÉES
 * Suivi des pas en temps réel via l'accéléromètre du smartphone (DeviceMotionEvent),
 * saisie manuelle / externe, calcul de distance (km) et calories de marche,
 * et unification avec les calories des séances d'entraînement (Workout).
 */

class PedometerManager {
  constructor() {
    this.isTracking = false;
    this.isPaused = false;
    this.sensorAvailable = null;
    this.permissionGranted = false;

    // Détection de pas
    this.sessionSteps = 0;
    this.sessionStartTime = null;
    this.sessionElapsedTime = 0;
    this.sessionTimer = null;

    // Algorithme de filtrage d'accélération
    this.lastStepTimestamp = 0;
    this.lastMagnitude = 9.81;
    this.stepThreshold = 1.35; // Seuil d'accélération nette (m/s²) au-dessus de la gravité
    this.minStepIntervalMs = 265; // Débouncing : cadence max ~226 pas/minute

    this.motionHandler = this.handleDeviceMotion.bind(this);
    this._saveDebounceTimer = null;
  }

  init() {
    this.checkSensorSupport();
    this.updateHomeActivityWidget();
  }

  // --- Vérification du support des capteurs de mouvement ---
  checkSensorSupport() {
    if (typeof window === 'undefined') return;
    this.sensorAvailable = 'DeviceMotionEvent' in window;
    
    // Sur iOS 13+, DeviceMotionEvent.requestPermission existe
    if (this.sensorAvailable && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      this.permissionGranted = false;
    } else if (this.sensorAvailable) {
      this.permissionGranted = true;
    }
  }

  async requestSensorPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          this.permissionGranted = true;
          return true;
        } else {
          this.permissionGranted = false;
          return false;
        }
      } catch (err) {
        console.warn('Erreur demande permission accéléromètre:', err);
        return false;
      }
    }
    this.permissionGranted = true;
    return true;
  }

  // --- Gestion du démarrage / arrêt du podomètre ---
  async startTracking() {
    if (this.isTracking && !this.isPaused) return;

    if (!this.permissionGranted) {
      const ok = await this.requestSensorPermission();
      if (!ok) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Autorisation accéléromètre requise pour compter les pas.');
        }
        return;
      }
    }

    if (this.isPaused) {
      // Reprise
      this.isPaused = false;
    } else {
      // Nouveau départ
      this.isTracking = true;
      this.isPaused = false;
      this.sessionSteps = 0;
      this.sessionStartTime = Date.now() - (this.sessionElapsedTime * 1000);
    }

    if (this.sessionTimer) clearInterval(this.sessionTimer);
    this.sessionTimer = setInterval(() => {
      this.sessionElapsedTime++;
      this.updateLiveSessionUI();
    }, 1000);

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('devicemotion', this.motionHandler, { passive: true });
    }

    this.updateTrackingControlsUI();
    this.updateHomeActivityWidget();

    if (typeof showToast === 'function') {
      showToast('🚶 Podomètre activé — Marchez à votre rythme !');
    }
  }

  pauseTracking() {
    if (!this.isTracking || this.isPaused) return;
    this.isPaused = true;
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('devicemotion', this.motionHandler);
    }
    this.updateTrackingControlsUI();
  }

  resumeTracking() {
    return this.startTracking();
  }

  stopTracking() {
    if (!this.isTracking) return;

    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('devicemotion', this.motionHandler);
    }
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }

    const recordedSteps = this.sessionSteps;
    const recordedSecs = this.sessionElapsedTime;

    this.isTracking = false;
    this.isPaused = false;
    this.sessionSteps = 0;
    this.sessionElapsedTime = 0;
    this.sessionStartTime = null;

    this.updateTrackingControlsUI();
    this.renderActivityView();
    this.updateHomeActivityWidget();

    if (typeof showToast === 'function') {
      const mins = Math.round(recordedSecs / 60);
      showToast(`🏁 Marche terminée : +${recordedSteps} pas (${mins} min)`);
    }
  }

  toggleTracking() {
    if (!this.isTracking) {
      this.startTracking();
    } else if (this.isPaused) {
      this.resumeTracking();
    } else {
      this.pauseTracking();
    }
  }

  // --- Traitement du flux d'accélération en temps réel ---
  handleDeviceMotion(event) {
    if (!this.isTracking || this.isPaused) return;

    let ax = 0, ay = 0, az = 0;
    let netAcc = 0;

    if (event.acceleration && (event.acceleration.x !== null || event.acceleration.y !== null || event.acceleration.z !== null)) {
      ax = event.acceleration.x || 0;
      ay = event.acceleration.y || 0;
      az = event.acceleration.z || 0;
      netAcc = Math.sqrt(ax * ax + ay * ay + az * az);
    } else if (event.accelerationIncludingGravity) {
      ax = event.accelerationIncludingGravity.x || 0;
      ay = event.accelerationIncludingGravity.y || 0;
      az = event.accelerationIncludingGravity.z || 0;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      // Différence absolue par rapport à la pesanteur terrestre standard (9.81 m/s²)
      netAcc = Math.abs(mag - 9.80665);
    }

    const now = Date.now();
    // Détection de pic avec temps réfractaire minimum (débouncing)
    if (netAcc > this.stepThreshold && (now - this.lastStepTimestamp) >= this.minStepIntervalMs) {
      this.lastStepTimestamp = now;
      this.sessionSteps++;

      // Enregistrer le pas dans le stockage applicatif
      if (typeof window !== 'undefined' && window.appStorage) {
        window.appStorage.addSteps(1, undefined, false);
      }

      this.updateLiveSessionUI();
      this.scheduleDebouncedViewUpdate();
    }

    this.lastMagnitude = netAcc;
  }

  scheduleDebouncedViewUpdate() {
    clearTimeout(this._saveDebounceTimer);
    this._saveDebounceTimer = setTimeout(() => {
      this.updateActivityMetricsDisplay();
      this.updateHomeActivityWidget();
    }, 400);
  }

  // --- Ajout manuel de pas (montre connectée, tapis, extérieur) ---
  addManualSteps(count) {
    const safeCount = parseInt(count, 10);
    if (isNaN(safeCount) || safeCount <= 0) return;

    if (typeof window !== 'undefined' && window.appStorage) {
      window.appStorage.addSteps(safeCount, undefined, true);
    }

    this.renderActivityView();
    this.updateHomeActivityWidget();

    if (typeof showToast === 'function') {
      showToast(`✅ +${safeCount.toLocaleString()} pas ajoutés avec succès !`);
    }
  }

  promptCustomSteps() {
    const input = prompt("Entrez le nombre de pas à ajouter :", "1000");
    if (!input) return;
    const count = parseInt(input.trim().replace(/\s/g, ''), 10);
    if (!isNaN(count) && count > 0) {
      this.addManualSteps(count);
    } else {
      if (typeof showToast === 'function') {
        showToast("⚠️ Nombre de pas invalide.");
      }
    }
  }

  resetTodaySteps() {
    const confirmMsg = "Voulez-vous vraiment réinitialiser les pas enregistrés pour aujourd'hui ?";
    if (typeof showConfirmModal === 'function') {
      showConfirmModal("Réinitialiser les pas", confirmMsg, "🔄", () => {
        this._doResetSteps();
      });
    } else if (confirm(confirmMsg)) {
      this._doResetSteps();
    }
  }

  _doResetSteps() {
    if (typeof window !== 'undefined' && window.appStorage) {
      window.appStorage.resetDailySteps();
    }
    this.sessionSteps = 0;
    this.renderActivityView();
    this.updateHomeActivityWidget();
    if (typeof showToast === 'function') {
      showToast("🔄 Compteur de pas réinitialisé pour aujourd'hui.");
    }
  }

  // --- Rendu de la vue Activité & Podomètre (view-activity) ---
  renderActivityView() {
    if (typeof document === 'undefined') return;
    if (!window.appStorage) return;

    const summary = window.appStorage.getDailyActivitySummary();
    this.updateActivityGauges(summary);
    this.updateActivityMetricsDisplay(summary);
    this.renderWeeklyChart();
    this.updateTrackingControlsUI();
  }

  // Mise à jour des anneaux et jauges circulaires
  updateActivityGauges(summary = null) {
    if (typeof document === 'undefined') return;
    if (!summary && window.appStorage) {
      summary = window.appStorage.getDailyActivitySummary();
    }
    if (!summary) return;

    // Jauge de pas (progression)
    const stepProgressBar = document.getElementById('activity-step-circle');
    if (stepProgressBar) {
      const radius = 54;
      const circumference = 2 * Math.PI * radius; // ~339.29
      const offset = circumference - (Math.min(summary.stepPercent, 100) / 100) * circumference;
      stepProgressBar.style.strokeDasharray = `${circumference}`;
      stepProgressBar.style.strokeDashoffset = `${offset}`;
    }

    // Jauge de calories combinées
    const calorieProgressBar = document.getElementById('activity-cal-circle');
    if (calorieProgressBar) {
      const radius = 42;
      const circumference = 2 * Math.PI * radius; // ~263.89
      const offset = circumference - (Math.min(summary.caloriePercent, 100) / 100) * circumference;
      calorieProgressBar.style.strokeDasharray = `${circumference}`;
      calorieProgressBar.style.strokeDashoffset = `${offset}`;
    }

    // Pourcentage affiché au centre
    const centerPercentEl = document.getElementById('activity-gauge-percent');
    if (centerPercentEl) {
      centerPercentEl.textContent = `${summary.caloriePercent}%`;
    }
  }

  // Mise à jour des valeurs textuelles de l'activité
  updateActivityMetricsDisplay(summary = null) {
    if (typeof document === 'undefined') return;
    if (!summary && window.appStorage) {
      summary = window.appStorage.getDailyActivitySummary();
    }
    if (!summary) return;

    // Pas
    const elSteps = document.getElementById('activity-steps-current');
    if (elSteps) elSteps.textContent = summary.steps.toLocaleString();

    const elStepGoal = document.getElementById('activity-steps-goal');
    if (elStepGoal) elStepGoal.textContent = `${summary.stepGoal.toLocaleString()} pas`;

    const elDistance = document.getElementById('activity-distance-val');
    if (elDistance) elDistance.textContent = `${summary.distanceKm.toFixed(2)} km`;

    // Calories combinées
    const elTotalCal = document.getElementById('activity-total-cal');
    if (elTotalCal) elTotalCal.textContent = `${summary.totalCalories}`;

    const elCalGoal = document.getElementById('activity-cal-goal');
    if (elCalGoal) elCalGoal.textContent = `/ ${summary.calorieGoal} kcal`;

    // Décomposition
    const elWorkoutCal = document.getElementById('activity-workout-cal');
    if (elWorkoutCal) elWorkoutCal.textContent = `${summary.workoutCalories} kcal`;

    const elWorkoutDetail = document.getElementById('activity-workout-detail');
    if (elWorkoutDetail) {
      elWorkoutDetail.textContent = `${summary.workoutCount} séance${summary.workoutCount > 1 ? 's' : ''} (${summary.workoutMinutes} min)`;
    }

    const elStepCal = document.getElementById('activity-step-cal');
    if (elStepCal) elStepCal.textContent = `${summary.stepCalories} kcal`;

    const elStepDetail = document.getElementById('activity-step-detail');
    if (elStepDetail) {
      elStepDetail.textContent = `${summary.steps.toLocaleString()} pas (${summary.distanceKm.toFixed(2)} km)`;
    }
  }

  // Mise à jour de l'UI de la session active
  updateLiveSessionUI() {
    if (typeof document === 'undefined') return;

    const liveStepsEl = document.getElementById('activity-live-session-steps');
    if (liveStepsEl) {
      liveStepsEl.textContent = this.sessionSteps.toLocaleString();
    }

    const liveTimeEl = document.getElementById('activity-live-session-time');
    if (liveTimeEl) {
      const mins = Math.floor(this.sessionElapsedTime / 60);
      const secs = this.sessionElapsedTime % 60;
      liveTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }

  // Mise à jour des boutons de contrôle du podomètre
  updateTrackingControlsUI() {
    if (typeof document === 'undefined') return;

    const btnStart = document.getElementById('btn-pedometer-start');
    const btnPause = document.getElementById('btn-pedometer-pause');
    const btnStop = document.getElementById('btn-pedometer-stop');
    const statusPill = document.getElementById('pedometer-status-pill');
    const liveBox = document.getElementById('pedometer-live-box');

    if (!btnStart || !btnPause || !btnStop || !statusPill) return;

    if (!this.isTracking) {
      btnStart.style.display = 'inline-flex';
      btnStart.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="2"/>
          <path d="M10 22v-5l-2-2 1.5-4L14 13v9"/>
          <path d="M7 13l3-2 3 2"/>
        </svg>
        Démarrer la marche
      `;
      btnStart.className = 'btn-primary pedometer-btn';
      btnPause.style.display = 'none';
      btnStop.style.display = 'none';

      statusPill.className = 'pedometer-status-pill idle';
      statusPill.innerHTML = '<span class="status-dot"></span> En attente';

      if (liveBox) liveBox.style.display = 'none';
    } else if (this.isPaused) {
      btnStart.style.display = 'inline-flex';
      btnStart.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Reprendre
      `;
      btnStart.className = 'btn-primary pedometer-btn';
      btnPause.style.display = 'none';
      btnStop.style.display = 'inline-flex';

      statusPill.className = 'pedometer-status-pill paused';
      statusPill.innerHTML = '<span class="status-dot"></span> En pause';

      if (liveBox) liveBox.style.display = 'flex';
    } else {
      // En cours de marche
      btnStart.style.display = 'none';
      btnPause.style.display = 'inline-flex';
      btnStop.style.display = 'inline-flex';

      statusPill.className = 'pedometer-status-pill active';
      statusPill.innerHTML = '<span class="status-dot pulse"></span> Détection en cours';

      if (liveBox) liveBox.style.display = 'flex';
    }
  }

  // --- Graphique d'activité sur 7 jours (Double barre : Workout vs Pas) ---
  renderWeeklyChart() {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('activity-weekly-chart');
    if (!container || !window.appStorage) return;

    const daysData = window.appStorage.getWeeklyActivitySummary(7);
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // Trouver le maximum pour l'échelle
    const maxKcal = Math.max(
      ...daysData.map(d => d.totalCalories),
      ...daysData.map(d => d.calorieGoal),
      600
    );

    let html = '<div class="activity-bars-grid">';

    daysData.forEach(day => {
      const dObj = new Date(day.date + 'T12:00:00');
      const dayLabel = dayNames[dObj.getDay()];
      const isToday = day.date === window.appStorage.formatDateISO(new Date());

      const workoutHeightPct = Math.min(Math.round((day.workoutCalories / maxKcal) * 100), 100);
      const stepHeightPct = Math.min(Math.round((day.stepCalories / maxKcal) * 100), 100);
      const goalMet = day.totalCalories >= day.calorieGoal && day.calorieGoal > 0;

      html += `
        <div class="activity-bar-col ${isToday ? 'is-today' : ''}">
          <div class="activity-bar-track" title="${day.date} : ${day.totalCalories} kcal (${day.workoutCalories} workout + ${day.stepCalories} pas)">
            ${goalMet ? '<span class="activity-goal-star">★</span>' : ''}
            <div class="activity-bar-segment step-segment" style="height: ${stepHeightPct}%;"></div>
            <div class="activity-bar-segment workout-segment" style="height: ${workoutHeightPct}%;"></div>
          </div>
          <span class="activity-bar-label">${dayLabel}</span>
          <span class="activity-bar-val">${day.totalCalories > 0 ? day.totalCalories : '-'}</span>
        </div>
      `;
    });

    html += '</div>';

    // Légende
    html += `
      <div class="activity-chart-legend">
        <div class="legend-item"><span class="legend-color workout-color"></span> Workout HIIT</div>
        <div class="legend-item"><span class="legend-color step-color"></span> Marche / Pas</div>
        <div class="legend-item"><span class="legend-star">★</span> Objectif atteint</div>
      </div>
    `;

    container.innerHTML = html;
  }

  // --- Widget d'activité & calories sur la page d'accueil (view-home) ---
  updateHomeActivityWidget() {
    if (typeof document === 'undefined') return;
    if (!window.appStorage) return;

    const summary = window.appStorage.getDailyActivitySummary();

    const elTotal = document.getElementById('home-activity-total-cal');
    if (elTotal) elTotal.textContent = `${summary.totalCalories}`;

    const elGoal = document.getElementById('home-activity-goal-cal');
    if (elGoal) elGoal.textContent = `/ ${summary.calorieGoal} kcal`;

    const elSteps = document.getElementById('home-activity-steps');
    if (elSteps) elSteps.textContent = summary.steps.toLocaleString();

    const elWorkoutCal = document.getElementById('home-activity-workout-cal');
    if (elWorkoutCal) elWorkoutCal.textContent = `${summary.workoutCalories} kcal`;

    const elStepCal = document.getElementById('home-activity-step-cal');
    if (elStepCal) elStepCal.textContent = `${summary.stepCalories} kcal`;

    const elBar = document.getElementById('home-activity-progress-bar');
    if (elBar) {
      elBar.style.width = `${Math.min(summary.caloriePercent, 100)}%`;
      elBar.setAttribute('aria-valuenow', summary.caloriePercent);
    }

    const elPercent = document.getElementById('home-activity-percent');
    if (elPercent) elPercent.textContent = `${summary.caloriePercent}%`;
  }
}

// Instance globale
if (typeof window !== 'undefined') {
  window.pedometerManager = new PedometerManager();
}
