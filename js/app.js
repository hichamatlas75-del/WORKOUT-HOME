/**
 * FULL BODY 17 — APPLICATION PRINCIPALE & ROUTEUR D'INTERFACE
 * Liaison de tous les composants, navigation, compte à rebours 17:00 et modales.
 */

let _liveClockInterval = null; // Référence stockée pour pouvoir annuler et relancer proprement

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialiser le thème (Sombre par défaut ou sauvegardé)
  try {
    const savedTheme = window.appStorage.prefs.theme || 'dark';
    const resolvedTheme = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) themeSelect.value = savedTheme;
  } catch (e) { console.warn('Theme init error:', e); }

  // 2. Initialiser les réglages dans le formulaire
  try { loadSettingsForm(); } catch (e) { console.warn('Settings init error:', e); }
  try { updateAvatarDisplay(); } catch (e) { console.warn('Avatar init error:', e); }

  // 3. Initialiser la liste des exercices sur la vue d'accueil
  try { renderHomeExercisesList(); } catch (e) { console.warn('Exercises init error:', e); }

  // 4. Initialiser la navigation par onglets
  try { initTabNavigation(); } catch (e) { console.warn('Navigation init error:', e); }

  // 5. Initialiser les écouteurs de la séance en direct
  try { initWorkoutUI(); } catch (e) { console.warn('Workout UI init error:', e); }

  // 6. Démarrer le compte à rebours 17:00 en direct
  try { startLiveClock(); } catch (e) { console.warn('Clock init error:', e); }

  // 7. Initialiser les notifications & rappels
  try { window.notificationManager.startReminderWatcher(); } catch (e) { console.warn('Notification init error:', e); }

  // 8. Rendu initial du tableau de bord & badges
  try { window.dashboardManager.renderDashboard(); } catch (e) { console.warn('Dashboard init error:', e); }
  try { window.motivationManager.renderBadgesView(); } catch (e) { console.warn('Badges init error:', e); }

  // 9. Vérifier les paramètres URL (ex: ?action=start ou ?tab=...)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'start') {
      startWorkoutSession();
    } else if (urlParams.get('tab')) {
      switchTab(urlParams.get('tab'));
    }
  } catch (e) { console.warn('URL params error:', e); }

  // 10. Synchronisation automatique du profil au démarrage (si connecté)
  try {
    if (window.syncManager && window.appStorage.prefs.syncUserId && window.appStorage.prefs.syncAutoEnabled) {
      window.syncManager.sync({ silent: true });
    }
  } catch (e) { console.warn('Auto sync error:', e); }
});

// --------------------------------------------------------------------------
// GESTION DU COMPTE À REBOURS 17:00 (ACCUEIL)
// --------------------------------------------------------------------------
function startLiveClock() {
  // Annuler l'intervalle précédent si reInitApp() est appelé plusieurs fois
  if (_liveClockInterval) {
    clearInterval(_liveClockInterval);
    _liveClockInterval = null;
  }

  const updateClock = () => {
    const now = new Date();
    const prefs = window.appStorage.prefs;
    const targetTimeStr = prefs.targetTime || "17:00";
    const [targetHour, targetMin] = targetTimeStr.split(':').map(Number);

    const targetDate = new Date();
    targetDate.setHours(targetHour, targetMin, 0, 0);

    const streakStats = window.appStorage.getStreakStats();
    const subLabel = document.getElementById('hero-countdown-label');
    const targetDisplay = document.getElementById('hero-target-display');

    if (targetDisplay) targetDisplay.textContent = targetTimeStr;

    if (streakStats.doneToday) {
      if (subLabel) subLabel.textContent = "✅ Séance du jour accomplie !";
      return;
    }

    let diffMs = targetDate - now;
    if (diffMs < 0) {
      // 17h est déjà passée aujourd'hui
      if (diffMs > -3600000) { // Dans l'heure
        if (subLabel) subLabel.textContent = "⚡ C'est l'heure de votre séance !";
      } else {
        if (subLabel) subLabel.textContent = "⏰ Séance en attente aujourd'hui";
      }
    } else {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (subLabel) {
        if (diffHours === 0) {
          subLabel.textContent = `Prochaine séance dans ${diffMins} min`;
        } else {
          subLabel.textContent = `Prochaine séance dans ${diffHours}h ${diffMins}m`;
        }
      }
    }
  };

  updateClock();
  _liveClockInterval = setInterval(updateClock, 30000);
}

// --------------------------------------------------------------------------
// LISTE DES EXERCICES SUR L'ACCUEIL & SÉLECTION DE NIVEAU
// --------------------------------------------------------------------------
function renderHomeExercisesList() {
  const container = document.getElementById('home-exercise-list');
  if (!container) return;

  const prefs = window.appStorage ? window.appStorage.prefs : {};
  const activeExercises = typeof window.getActiveWorkoutExercises === 'function'
    ? window.getActiveWorkoutExercises(prefs)
    : (window.EXERCISES_DATA || []);

  const activeProf = window.appStorage ? window.appStorage.getActiveProfile() : null;

  // 1. Mettre à jour l'en-tête utilisateur sur l'accueil
  const userAvatarEl = document.getElementById('home-user-avatar');
  const userNameEl = document.getElementById('home-user-name');
  const userLevelBadge = document.getElementById('home-user-level-badge');
  const mainCount = activeExercises.filter(e => !e.isCoolDown).length;

  if (userAvatarEl && activeProf) userAvatarEl.textContent = activeProf.avatar || '🦁';
  if (userNameEl && activeProf) userNameEl.textContent = activeProf.name || 'Moi';
  if (userLevelBadge) {
    const level = prefs.userLevel || 'intermediate';
    const levelNames = {
      beginner: '🟢 Débutant',
      intermediate: '🟡 Intermédiaire',
      advanced: '🔴 Avancé',
      custom: `✨ Sur-mesure (${mainCount} ex)`
    };
    userLevelBadge.textContent = levelNames[level] || 'Intermédiaire';
  }

  // 2. Mettre à jour les specs hero
  const specCount = document.getElementById('home-spec-count');
  const specRounds = document.getElementById('home-spec-rounds');
  const specWorkRest = document.getElementById('home-spec-workrest');
  const durationPill = document.getElementById('home-duration-pill');
  const routineSubtitle = document.getElementById('home-routine-subtitle');

  const rounds = prefs.rounds || 3;
  const workSec = prefs.workDuration || 40;
  const restSec = prefs.restDuration || 20;
  const estMinutes = Math.round((rounds * mainCount * (workSec + restSec) + 60) / 60);

  if (specCount) specCount.textContent = activeExercises.length;
  if (specRounds) specRounds.textContent = `${rounds} Séries`;
  if (specWorkRest) specWorkRest.textContent = `${workSec}s / ${restSec}s`;
  if (durationPill) durationPill.textContent = `${estMinutes - 2}-${estMinutes + 2} min`;
  if (routineSubtitle) {
    const customPrefix = (prefs.userLevel === 'custom') ? '✨ ' : '';
    const customSuffix = (prefs.userLevel === 'custom') ? ' sur-mesure' : '';
    routineSubtitle.textContent = `${customPrefix}${mainCount} exercices${customSuffix} (${rounds} séries) + Étirements (1 série finale)`;
  }

  // 3. Mettre à jour les boutons de niveau actif
  const levelBtns = document.querySelectorAll('#home-level-pills .level-pill-btn');
  levelBtns.forEach(btn => {
    const btnLevel = btn.getAttribute('data-level');
    btn.classList.toggle('active', btnLevel === (prefs.userLevel || 'intermediate'));
  });

  // 4. Rendu de la liste d'exercices
  container.innerHTML = activeExercises.map((ex, index) => {
    const durationDisplay = ex.isPlank 
      ? (prefs.plankDuration == 120 ? '2 min' : `${prefs.plankDuration || 45}s`)
      : `${ex.duration}s`;

    const numDisplay = String(index + 1).padStart(2, '0');
    const levelClass = ex.level || 'intermediate';

    return `
      <div class="exercise-item-card" onclick="openExerciseModal(${ex.id})">
        <div class="ex-thumb-container">
          <img src="${ex.image}" alt="${ex.name}" class="ex-thumb-img" loading="lazy">
          <span class="ex-thumb-badge">${numDisplay}</span>
        </div>
        <div class="ex-info">
          <div class="ex-name" style="display: flex; align-items: center; gap: 6px;">
            <span>${ex.name}</span>
            <span class="badge-tag-level ${levelClass}" style="font-size: 0.6rem;">${ex.levelLabel || 'Standard'}</span>
          </div>
          <div class="ex-desc">${ex.subtitle}</div>
        </div>
        <div class="ex-meta">
          <span class="ex-tag" style="${ex.isPlank ? 'color: var(--accent-work); font-weight: 800;' : ''}">${durationDisplay}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

function setUserLevel(level) {
  if (!window.appStorage) return;
  if (level === 'custom') {
    openCustomExercisesModal();
    return;
  }
  window.appStorage.savePreferences({
    userLevel: level,
    customExerciseIds: null
  });
  renderHomeExercisesList();
  const levelNames = { beginner: '🟢 Débutant', intermediate: '🟡 Intermédiaire', advanced: '🔴 Avancé' };
  if (typeof showToast === 'function') {
    showToast(`Niveau réglé sur : ${levelNames[level] || level}`);
  }
}

// --------------------------------------------------------------------------
// MODALE DÉTAILLÉE D'UN EXERCICE
// --------------------------------------------------------------------------
function openExerciseModal(exerciseId) {
  const all = typeof window.getAllExercises === 'function' ? window.getAllExercises() : (window.EXERCISES_DATA || []);
  const ex = all.find(e => e.id === Number(exerciseId));
  if (!ex) return;

  const prefs = window.appStorage.prefs;
  const durationDisplay = ex.isPlank 
    ? (prefs.plankDuration == 120 ? '2 minutes' : `${prefs.plankDuration || 45} sec`)
    : `${ex.duration} sec`;

  const titleEl = document.getElementById('modal-ex-title');
  const numberEl = document.getElementById('modal-ex-num');
  const musclesEl = document.getElementById('modal-ex-muscles');
  const descEl = document.getElementById('modal-ex-desc');
  const cueEl = document.getElementById('modal-ex-cue');
  const breathingEl = document.getElementById('modal-ex-breathing');
  const adaptEl = document.getElementById('modal-ex-adapt');
  const svgEl = document.getElementById('modal-ex-svg-box');

  if (titleEl) titleEl.textContent = ex.name;
  const totalExFormatted = String(EXERCISES_DATA.length).padStart(2, '0');
  if (numberEl) numberEl.textContent = `Exercice ${ex.number}/${totalExFormatted} • ${durationDisplay}`;
  if (musclesEl) musclesEl.textContent = ex.targetMuscles;
  if (descEl) descEl.textContent = ex.description;
  if (cueEl) cueEl.textContent = ex.cue;
  if (breathingEl) breathingEl.textContent = ex.breathing;
  if (adaptEl) adaptEl.textContent = ex.adaptation;
  if (svgEl) svgEl.innerHTML = ex.illustrationHtml;

  const backdrop = document.getElementById('exercise-modal-sheet');
  if (backdrop) backdrop.classList.add('active');
}

function closeExerciseModal() {
  const backdrop = document.getElementById('exercise-modal-sheet');
  if (backdrop) backdrop.classList.remove('active');
}

// --------------------------------------------------------------------------
// NAVIGATION PAR ONGLETS (TABS)
// --------------------------------------------------------------------------
function initTabNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  // Mettre à jour les boutons
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
  });

  // Mettre à jour les vues
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${tabName}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Mettre à jour les données si nécessaire
  if (tabName === 'dashboard') {
    window.dashboardManager.renderDashboard();
  } else if (tabName === 'badges') {
    window.motivationManager.renderBadgesView();
  }
}

window.switchTab = switchTab;

// --------------------------------------------------------------------------
// MOTEUR D'ENTRAÎNEMENT & WORKOUT UI
// --------------------------------------------------------------------------
function startWorkoutSession() {
  window.audioEngine.initContext();
  updateWorkoutMusicBtnState();
  const overlay = document.getElementById('workout-overlay');
  if (overlay) overlay.classList.add('active');

  // Intercepter le bouton Retour Android
  history.pushState({ workout: true }, '', '');

  window.workoutEngine.startWorkout({
    rounds: parseInt(window.appStorage.prefs.rounds) || 3,
    workDuration: Math.min(90, Math.max(20, parseInt(window.appStorage.prefs.workDuration) || 40)),
    restDuration: Math.min(60, Math.max(10, parseInt(window.appStorage.prefs.restDuration) || 20))
  });
}

function initWorkoutUI() {
  const overlay = document.getElementById('workout-overlay');
  const timerCircle = document.getElementById('timer-progress-bar');
  const timerDigits = document.getElementById('live-timer-digits');
  const timerBadge = document.getElementById('live-timer-badge');
  const roundPill = document.getElementById('live-round-pill');
  const stepPill = document.getElementById('live-step-pill');
  const exerciseName = document.getElementById('live-ex-name');
  const exerciseCue = document.getElementById('live-ex-cue');
  const illustrationBox = document.getElementById('live-illustration-box');
  const nextBox = document.getElementById('live-next-info');
  const btnPause = document.getElementById('btn-live-pause');

  if (nextBox) {
    nextBox.onclick = () => jumpToNextExercise();
  }

  const CIRCUMFERENCE = 2 * Math.PI * 110; // ~691.15

  // Mise à jour continue (Tick)
  window.workoutEngine.onTick = (remaining, total, info) => {
    if (timerDigits) timerDigits.textContent = Math.ceil(remaining);

    if (timerCircle && total > 0) {
      const progress = remaining / total;
      const offset = CIRCUMFERENCE * (1 - progress);
      timerCircle.style.strokeDashoffset = offset;
    }
  };

  // Changement de phase
  window.workoutEngine.onStateChange = (state, info) => {
    if (roundPill) roundPill.textContent = info.roundLabel || `Série ${info.currentRound} / ${info.totalRounds}`;
    if (stepPill) stepPill.textContent = info.stepLabel || `${info.exerciseIndex} / ${info.totalExercises}`;

    if (state === WORKOUT_STATES.PREPARE) {
      if (timerBadge) timerBadge.textContent = "PRÉPARATION";
      if (exerciseName) exerciseName.textContent = info.currentExercise.name;
      if (exerciseCue) exerciseCue.textContent = "Préparez votre posture";
      if (illustrationBox) illustrationBox.innerHTML = info.currentExercise.illustrationHtml;
      if (nextBox) nextBox.innerHTML = `<span>Premier mouvement :</span> <strong>${info.currentExercise.name}</strong>`;
      updatePip(null); // pas de PIP pendant la préparation
      syncWorkoutMedia(state, illustrationBox);
    } else if (state === WORKOUT_STATES.WORK) {
      if (timerBadge) timerBadge.textContent = "EFFORT";
      if (exerciseName) exerciseName.textContent = info.currentExercise.name;
      if (exerciseCue) exerciseCue.textContent = info.currentExercise.cue;
      if (illustrationBox) illustrationBox.innerHTML = info.currentExercise.illustrationHtml;
      if (nextBox) nextBox.innerHTML = `<span>À suivre :</span> <strong>${info.nextExercise ? info.nextExercise.name : '—'}</strong>`;
      updatePip(info.nextExercise);
      syncWorkoutMedia(state, illustrationBox);
    } else if (state === WORKOUT_STATES.REST) {
      if (timerBadge) timerBadge.textContent = "RÉCUPÉRATION";
      if (exerciseName) exerciseName.textContent = "REPOS & RESPIRATION";
      if (exerciseCue) exerciseCue.textContent = "Inspirez profondément, relâchez les épaules";
      if (illustrationBox) illustrationBox.innerHTML = info.nextExercise.illustrationHtml;
      if (nextBox) nextBox.innerHTML = `<span>Prochain :</span> <strong>${info.nextExercise.name}</strong>`;
      updatePip(null); // pendant le repos, la vidéo du prochain est déjà l'écran principal
      syncWorkoutMedia(state, illustrationBox);
    } else if (state === WORKOUT_STATES.PAUSED) {
      if (timerBadge) timerBadge.textContent = "EN PAUSE";
      syncWorkoutMedia(state, illustrationBox);
    }

    if (btnPause) {
      btnPause.classList.toggle('paused', state === WORKOUT_STATES.PAUSED);
      btnPause.innerHTML = state === WORKOUT_STATES.PAUSED
        ? `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    }
  };

  // Fin de séance
  window.workoutEngine.onFinish = (session) => {
    if (overlay) overlay.classList.remove('active');

    // Vérifier les badges débloqués
    const newBadges = window.motivationManager.checkAndUnlockBadges(session);

    // Mettre à jour les données de célébration
    const totalMin = Math.max(1, Math.round(session.durationSeconds / 60));
    document.getElementById('celeb-time').textContent = `${totalMin} min`;
    document.getElementById('celeb-rounds').textContent = `${session.rounds} tours`;
    document.getElementById('celeb-calories').textContent = `~${session.caloriesEstimated} kcal`;

    const streakStats = window.appStorage.getStreakStats();
    document.getElementById('celeb-streak').textContent = `🔥 Série : ${streakStats.currentStreak} jour(s) consécutif(s)`;

    // Afficher les badges nouvellement débloqués
    const badgeNotice = document.getElementById('celeb-badge-notice');
    if (badgeNotice) {
      if (newBadges.length > 0) {
        badgeNotice.style.display = 'block';
        badgeNotice.textContent = `🌟 Nouveau badge débloqué : ${newBadges.map(b => b.title).join(', ')} !`;
      } else {
        badgeNotice.style.display = 'none';
      }
    }

    // Afficher la modale de célébration & lancer les confettis
    const celebModal = document.getElementById('celebration-modal');
    if (celebModal) celebModal.classList.add('active');
    window.motivationManager.launchConfetti();
  };

  // Intercepter le bouton Retour Android pour fermer la séance proprement
  window.addEventListener('popstate', (e) => {
    const overlay = document.getElementById('workout-overlay');
    if (overlay && overlay.classList.contains('active')) {
      confirmQuitWorkout();
    }
  });
}

// Boutons de contrôle de la séance
function toggleWorkoutPause() {
  window.workoutEngine.togglePause();
}

function skipWorkoutExercise() {
  window.workoutEngine.skipNext();
}

function jumpToNextExercise() {
  window.workoutEngine.jumpToNextExercise();
}

function prevWorkoutExercise() {
  window.workoutEngine.previousStep();
}

function confirmQuitWorkout() {
  showConfirmModal(
    'Interrompre la séance ?',
    'Votre progression de cette séance ne sera pas enregistrée.',
    '🚪',
    () => {
      window.workoutEngine.quitWorkout();
      const overlay = document.getElementById('workout-overlay');
      if (overlay) overlay.classList.remove('active');
    }
  );
}

function closeCelebration() {
  window.motivationManager.stopConfetti();
  const celebModal = document.getElementById('celebration-modal');
  if (celebModal) celebModal.classList.remove('active');
  switchTab('dashboard');
}

// --------------------------------------------------------------------------
// GESTION DU FORMULAIRE DE RÉGLAGES
// --------------------------------------------------------------------------
function loadSettingsForm() {
  const prefs = window.appStorage.prefs;

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
  const musicVolumeLbl = document.getElementById('setting-music-volume-lbl');
  const reminderSwitch = document.getElementById('setting-reminder');
  const initWeightInput = document.getElementById('setting-initial-weight');
  const targetWeightInput = document.getElementById('setting-target-weight');
  const heightInput = document.getElementById('setting-height-cm');
  const firebaseUrlInput = document.getElementById('setting-firebase-url');
  const syncIdInput = document.getElementById('sync-user-id');
  const syncPinInput = document.getElementById('sync-user-pin');
  const syncAutoSwitch = document.getElementById('sync-auto-enabled');

  if (timeInput) timeInput.value = prefs.targetTime || "17:00";
  if (roundsInput) roundsInput.value = prefs.rounds || 3;
  if (plankInput) plankInput.value = prefs.plankDuration || 45;
  if (workInput) workInput.value = prefs.workDuration || 40;
  if (restInput) restInput.value = prefs.restDuration || 20;
  if (soundSwitch) soundSwitch.checked = prefs.soundEnabled !== false;
  if (voiceSwitch) voiceSwitch.checked = prefs.voiceEnabled !== false;
  if (musicSwitch) musicSwitch.checked = prefs.musicEnabled !== false;
  if (musicStyleSelect) musicStyleSelect.value = prefs.musicStyle || "synthwave";
  if (musicVolumeSlider) {
    const volPct = Math.round((prefs.musicVolume !== undefined ? prefs.musicVolume : 0.6) * 100);
    musicVolumeSlider.value = volPct;
    if (musicVolumeLbl) musicVolumeLbl.textContent = volPct + '%';
  }
  if (reminderSwitch) reminderSwitch.checked = prefs.reminderActive !== false;
  const reminderStatusDesc = document.getElementById('setting-reminder-status-desc');
  if (reminderStatusDesc && window.notificationManager) {
    reminderStatusDesc.textContent = `Statut : ${window.notificationManager.getPermissionStatus()}`;
  }
  if (initWeightInput) initWeightInput.value = prefs.initialWeight || "";
  if (targetWeightInput) targetWeightInput.value = prefs.targetWeight || "";
  if (heightInput) heightInput.value = prefs.heightCm || "";
  if (firebaseUrlInput) firebaseUrlInput.value = prefs.firebaseUrl || "";
  if (syncIdInput) syncIdInput.value = prefs.syncUserId || "";
  if (syncPinInput) syncPinInput.value = prefs.syncUserPin || "";
  if (syncAutoSwitch) syncAutoSwitch.checked = prefs.syncAutoEnabled !== false;

  window.audioEngine.soundEnabled = prefs.soundEnabled !== false;
  window.audioEngine.voiceEnabled = prefs.voiceEnabled !== false;
  if (window.audioEngine.musicEngine) {
    window.audioEngine.musicEngine.enabled = prefs.musicEnabled !== false;
    window.audioEngine.musicEngine.setVolume(prefs.musicVolume !== undefined ? prefs.musicVolume : 0.6);
    window.audioEngine.musicEngine.setStyle(prefs.musicStyle || "synthwave");
  }

  if (window.syncManager) {
    window.syncManager.updateStatusUI();
  }
}

function saveSettings() {
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

  const newPrefs = {
    targetTime: timeInput ? timeInput.value : "17:00",
    rounds: roundsInput ? Math.min(4, Math.max(2, parseInt(roundsInput.value) || 3)) : 3,
    plankDuration: plankInput ? parseInt(plankInput.value) : 45,
    workDuration: workInput ? Math.min(90, Math.max(20, parseInt(workInput.value) || 40)) : 40,
    restDuration: restInput ? Math.min(60, Math.max(10, parseInt(restInput.value) || 20)) : 20,
    soundEnabled: soundSwitch ? soundSwitch.checked : true,
    voiceEnabled: voiceSwitch ? voiceSwitch.checked : true,
    musicEnabled: musicSwitch ? musicSwitch.checked : true,
    musicStyle: musicStyleSelect ? musicStyleSelect.value : "synthwave",
    musicVolume: musicVolumeSlider ? (parseInt(musicVolumeSlider.value) / 100) : 0.6,
    reminderActive: reminderSwitch ? reminderSwitch.checked : true,
    theme: themeSelect ? themeSelect.value : "dark",
    initialWeight: initWeightInput && initWeightInput.value ? parseFloat(initWeightInput.value) : null,
    targetWeight: targetWeightInput && targetWeightInput.value ? parseFloat(targetWeightInput.value) : null,
    heightCm: heightInput && heightInput.value ? parseInt(heightInput.value) : null,
    firebaseUrl: firebaseUrlInput ? firebaseUrlInput.value.trim() : (window.appStorage.prefs.firebaseUrl || ""),
    syncUserId: syncIdInput ? syncIdInput.value.trim().toLowerCase() : "",
    syncUserPin: syncPinInput ? syncPinInput.value.trim() : "",
    syncAutoEnabled: syncAutoSwitch ? syncAutoSwitch.checked : true
  };

  window.appStorage.savePreferences(newPrefs);
  const resolvedTheme = newPrefs.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : newPrefs.theme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  window.audioEngine.soundEnabled = newPrefs.soundEnabled;
  window.audioEngine.voiceEnabled = newPrefs.voiceEnabled;
  if (window.audioEngine.musicEngine) {
    window.audioEngine.musicEngine.enabled = newPrefs.musicEnabled;
    window.audioEngine.musicEngine.setVolume(newPrefs.musicVolume);
    window.audioEngine.musicEngine.setStyle(newPrefs.musicStyle);
  }
  updateWorkoutMusicBtnState();

  if (window.syncManager) {
    window.syncManager.updateStatusUI();
    if (newPrefs.syncUserId && newPrefs.syncUserPin && newPrefs.syncAutoEnabled) {
      window.syncManager.sync({ silent: true });
    }
  }

  if (window.notificationManager) {
    window.notificationManager.syncStateWithServiceWorker();
    const reminderStatusDesc = document.getElementById('setting-reminder-status-desc');
    if (reminderStatusDesc) {
      reminderStatusDesc.textContent = `Statut : ${window.notificationManager.getPermissionStatus()}`;
    }
  }

  // Mise à jour de l'affichage de l'accueil et du tableau de bord
  const targetDisplay = document.getElementById('hero-target-display');
  if (targetDisplay) targetDisplay.textContent = newPrefs.targetTime;

  renderHomeExercisesList();
  if (window.dashboardManager) window.dashboardManager.renderDashboard();

  showToast("✅ Réglages enregistrés avec succès !");
}

// --------------------------------------------------------------------------
// CONTRÔLE RAPIDE DE LA MUSIQUE PENDANT LA SÉANCE
// --------------------------------------------------------------------------
function toggleWorkoutMusic() {
  if (!window.audioEngine || !window.audioEngine.musicEngine) return;
  window.audioEngine.initContext();
  const musicEngine = window.audioEngine.musicEngine;
  musicEngine.enabled = !musicEngine.enabled;
  window.appStorage.savePreferences({ musicEnabled: musicEngine.enabled });

  const btnMusic = document.getElementById('btn-live-music');
  const settingMusic = document.getElementById('setting-music');
  if (settingMusic) settingMusic.checked = musicEngine.enabled;

  if (musicEngine.enabled) {
    if (btnMusic) btnMusic.classList.remove('muted');
    if (window.workoutEngine && window.workoutEngine.state !== WORKOUT_STATES.IDLE && window.workoutEngine.state !== WORKOUT_STATES.COMPLETED) {
      musicEngine.start(window.workoutEngine.state);
    }
    showToast("🎵 Musique de fond activée");
  } else {
    if (btnMusic) btnMusic.classList.add('muted');
    musicEngine.stop();
    showToast("🔇 Musique de fond coupée");
  }
}

function updateWorkoutMusicBtnState() {
  const btnMusic = document.getElementById('btn-live-music');
  const isEnabled = window.appStorage ? (window.appStorage.prefs.musicEnabled !== false) : true;
  if (btnMusic) {
    btnMusic.classList.toggle('muted', !isEnabled);
  }
}

window.toggleWorkoutMusic = toggleWorkoutMusic;
window.updateWorkoutMusicBtnState = updateWorkoutMusicBtnState;

// --------------------------------------------------------------------------
// SAUVEGARDE & RESTAURATION (EXPORT / IMPORT JSON)
// --------------------------------------------------------------------------
function exportDataBackup() {
  const jsonStr = window.appStorage.exportJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fullbody17_sauvegarde_${window.appStorage.formatDateISO(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const success = window.appStorage.importJSON(e.target.result);
    if (success) {
      showToast("✅ Données restaurées avec succès !");
      reInitApp();
    } else {
      showToast("❌ Fichier de sauvegarde invalide.", true);
    }
  };
  reader.readAsText(file);
}

function confirmResetData() {
  showConfirmModal(
    'Effacer toutes les données ?',
    'Tout l\'historique des séances, statistiques, pesées et badges seront supprimés définitivement.',
    '🗑️',
    () => {
      window.appStorage.clearAllData();
      showToast("Données réinitialisées.");
      reInitApp();
    }
  );
}

// --------------------------------------------------------------------------
// RE-INITIALISATION SANS RECHARGEMENT DE PAGE
// --------------------------------------------------------------------------
function reInitApp() {
  // Recharger les préférences depuis le stockage
  window.appStorage.prefs = window.appStorage.loadPreferences();
  window.appStorage.history = window.appStorage.loadHistory();
  window.appStorage.badges = window.appStorage.loadBadges();
  window.appStorage.weightHistory = window.appStorage.loadWeightHistory();

  // Réappliquer le thème
  const savedTheme = window.appStorage.prefs.theme || 'dark';
  const resolvedTheme = savedTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedTheme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);

  // Reconstruire l'interface
  loadSettingsForm();
  updateAvatarDisplay();
  renderHomeExercisesList();
  startLiveClock();
  window.dashboardManager.renderDashboard();
  window.motivationManager.renderBadgesView();
  switchTab('home');
}

// --------------------------------------------------------------------------
// MODALE DE CONFIRMATION PERSONNALISÉE
// --------------------------------------------------------------------------
/**
 * Affiche une modale de confirmation stylisée (sans confirm() natif).
 * @param {string} title   - Titre de la modale
 * @param {string} message - Message descriptif
 * @param {string} icon    - Emoji icône (ex: '⚠️', '🗑️', '🚪')
 * @param {Function} onConfirm - Callback exécuté si l'utilisateur confirme
 */
function showConfirmModal(title, message, icon, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const messageEl = document.getElementById('confirm-modal-message');
  const iconEl = document.getElementById('confirm-modal-icon');
  const confirmBtn = document.getElementById('confirm-modal-confirm');

  if (!modal) return;

  if (titleEl) titleEl.textContent = title;
  if (messageEl) messageEl.textContent = message;
  if (iconEl) iconEl.textContent = icon || '⚠️';

  // Remplacer le listener du bouton Confirmer
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  newConfirmBtn.addEventListener('click', () => {
    dismissConfirmModal();
    onConfirm();
  });

  modal.style.display = 'flex';
  // Empêcher le scroll du fond
  document.body.style.overflow = 'hidden';
}

function dismissConfirmModal() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

// --------------------------------------------------------------------------
// NOTIFICATIONS TOAST (REMPLACEMENT DES alert())
// --------------------------------------------------------------------------
function showToast(message, isError = false) {
  // Supprimer le toast précédent s'il existe
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: calc(var(--safe-top, 16px) + 60px);
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: ${isError ? 'var(--accent-danger)' : 'var(--accent-work)'};
    color: #fff;
    padding: 12px 20px;
    border-radius: var(--radius-md, 20px);
    font-size: 0.88rem;
    font-weight: 700;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    max-width: 90vw;
    text-align: center;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Auto-remove after 2.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// --------------------------------------------------------------------------
// SYNCHRONISATION VIDÉO / 3D DU WORKOUT
// --------------------------------------------------------------------------
function syncWorkoutMedia(state, container) {
  if (!container) return;

  const video = container.querySelector('video');
  if (video) {
    if (state === WORKOUT_STATES.PAUSED) {
      video.pause();
    } else {
      video.play().catch(() => {
        // Autoplay policy fallback: muted is already active
      });
    }
  }
}

// --------------------------------------------------------------------------
// MINIATURE PIP — PROCHAIN EXERCICE
// --------------------------------------------------------------------------
/**
 * Affiche ou masque la petite fenêtre PIP du prochain exercice.
 * Doit être appelé APRÈS illustrationBox.innerHTML car innerHTML efface le PIP.
 * @param {Object|null} nextExercise - Objet exercice ou null pour masquer
 */
function updatePip(nextExercise) {
  // Le PIP est injecté dans live-illustration-box — re-chercher après chaque innerHTML
  const box = document.getElementById('live-illustration-box');
  if (!box) return;

  let pip = document.getElementById('live-pip-next');

  // Si innerHTML a effacé le PIP, le recréer
  if (!pip) {
    pip = document.createElement('div');
    pip.id = 'live-pip-next';
    pip.className = 'live-pip-next';
    pip.setAttribute('role', 'button');
    pip.setAttribute('tabindex', '0');
    pip.setAttribute('title', 'Cliquer pour passer directement à cet exercice');
    pip.setAttribute('aria-label', 'Passer directement au prochain exercice');
    pip.onclick = (e) => {
      e.stopPropagation();
      jumpToNextExercise();
    };
    pip.innerHTML = `<img id="live-pip-img" class="live-pip-img" src="" alt=""><span class="live-pip-label">Suivant ›</span>`;
    box.appendChild(pip);
  } else {
    pip.onclick = (e) => {
      e.stopPropagation();
      jumpToNextExercise();
    };
  }

  if (!nextExercise) {
    pip.style.display = 'none';
    return;
  }

  const img = pip.querySelector('#live-pip-img');
  if (img) {
    img.src = nextExercise.image;
    img.alt = nextExercise.name;
  }

  // Relancer l'animation slide-in à chaque changement d'exercice
  pip.style.animation = 'none';
  pip.offsetHeight; // force reflow
  pip.style.animation = '';
  pip.style.display = 'block';
}

// --------------------------------------------------------------------------
// DOUBLE AFFICHAGE PORTRAIT ET PAYSAGE (DOUBLE DISPLAY ORIENTATION)
// --------------------------------------------------------------------------
/**
 * Bascule manuellement entre affichage Portrait et Paysage sur l'écran d'entraînement.
 */
function toggleWorkoutOrientation() {
  const overlay = document.getElementById('workout-overlay');
  if (!overlay) return;

  const isLandscape = overlay.classList.toggle('mode-landscape');

  if (isLandscape) {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
    showToast("🖥️ Affichage Paysage activé");
  } else {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock().catch(() => {});
    }
    showToast("📱 Affichage Portrait activé");
  }
}

// --------------------------------------------------------------------------
// MODULE SUIVI DU POIDS (MODALE & GESTION DES PESÉES)
// --------------------------------------------------------------------------
/**
 * Ouvre la modale d'enregistrement de pesée.
 */
function openWeightModal() {
  const modal = document.getElementById('weight-modal');
  const inputVal = document.getElementById('weight-input-val');
  const inputDate = document.getElementById('weight-input-date');
  const inputNote = document.getElementById('weight-input-note');

  if (!modal) return;

  // Date du jour par défaut
  if (inputDate) {
    inputDate.value = window.appStorage.formatDateISO(new Date());
  }

  // Poids par défaut : dernière pesée enregistrée ou poids de départ
  if (inputVal) {
    const stats = window.appStorage.getWeightStats();
    if (stats.currentWeight) {
      inputVal.value = stats.currentWeight.toFixed(1);
    } else {
      inputVal.value = "70.0";
    }
  }

  if (inputNote) {
    inputNote.value = "";
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Ferme la modale de pesée.
 */
function closeWeightModal() {
  const modal = document.getElementById('weight-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

/**
 * Ajuste le poids dans le champ de saisie (+/- 0.1 ou 0.5 kg).
 */
function adjustWeightInput(delta) {
  const input = document.getElementById('weight-input-val');
  if (!input) return;
  const current = parseFloat(input.value) || 70.0;
  const next = Math.min(300, Math.max(20, Math.round((current + delta) * 10) / 10));
  input.value = next.toFixed(1);
}

/**
 * Enregistre la pesée saisie.
 */
function saveWeightEntry() {
  const inputVal = document.getElementById('weight-input-val');
  const inputDate = document.getElementById('weight-input-date');
  const inputNote = document.getElementById('weight-input-note');

  if (!inputVal || !inputVal.value) {
    showToast("⚠️ Veuillez renseigner votre poids.", true);
    return;
  }

  const weight = parseFloat(inputVal.value);
  if (isNaN(weight) || weight < 20 || weight > 300) {
    showToast("⚠️ Poids invalide (entre 20 et 300 kg).", true);
    return;
  }

  const date = inputDate && inputDate.value ? inputDate.value : window.appStorage.formatDateISO(new Date());
  const note = inputNote ? inputNote.value : '';

  const entry = window.appStorage.addWeightEntry({ weight, date, note });
  if (entry) {
    closeWeightModal();
    if (window.dashboardManager) {
      window.dashboardManager.renderWeightTracker();
    }
    if (window.syncManager) {
      window.syncManager.autoPush();
    }
    if (typeof updateProfileDrawerData === 'function') {
      updateProfileDrawerData();
    }
    showToast(`⚖️ Pesée de ${entry.weight} kg enregistrée !`);
  } else {
    showToast("❌ Erreur lors de l'enregistrement.", true);
  }
}

/**
 * Supprime une pesée spécifique.
 */
function deleteWeightLog(id) {
  showConfirmModal(
    'Supprimer cette pesée ?',
    'Cette mesure sera définitivement retirée de votre historique.',
    '🗑️',
    () => {
      window.appStorage.deleteWeightEntry(id);
      if (window.dashboardManager) {
        window.dashboardManager.renderWeightTracker();
      }
      if (window.syncManager) {
        window.syncManager.autoPush();
      }
      if (typeof updateProfileDrawerData === 'function') {
        updateProfileDrawerData();
      }
      showToast("Pesée supprimée.");
    }
  );
}

// --------------------------------------------------------------------------
// DÉCLENCHEUR DE CONNEXION ET SYNCHRONISATION MULTI-PROFILS
// --------------------------------------------------------------------------
async function triggerProfileSync(mode = 'sync') {
  const idInput = document.getElementById('sync-user-id');
  const pinInput = document.getElementById('sync-user-pin');
  const autoSwitch = document.getElementById('sync-auto-enabled');

  // Sauvegarder UNIQUEMENT le nom de profil et le mot de passe
  // (jamais l'URL Firebase qui est intégrée dans le code)
  if (idInput || pinInput) {
    window.appStorage.savePreferences({
      syncUserId: idInput ? idInput.value.trim().toLowerCase() : "",
      syncUserPin: pinInput ? pinInput.value.trim() : "",
      syncAutoEnabled: autoSwitch ? autoSwitch.checked : true
    });
  }

  if (mode === 'pull') {
    await window.syncManager.pullFromCloud();
  } else {
    await window.syncManager.sync();
  }
}

// --------------------------------------------------------------------------
// GESTION DU MENU BURGER & DU TIROIR PROFIL AVATAR
// --------------------------------------------------------------------------
function openProfileDrawer() {
  const overlay = document.getElementById('profile-drawer-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }
  updateProfileDrawerData();
}

function closeProfileDrawer() {
  const overlay = document.getElementById('profile-drawer-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      if (!overlay.classList.contains('active')) {
        overlay.style.display = 'none';
      }
    }, 250);
  }
}

function selectAvatar(avatarEmoji) {
  window.appStorage.savePreferences({ userAvatar: avatarEmoji });
  updateAvatarDisplay();
  if (window.syncManager) {
    window.syncManager.autoPush();
  }
  if (typeof showToast === 'function') {
    showToast(`Avatar ${avatarEmoji} sélectionné !`);
  }
}

function updateAvatarDisplay() {
  const prefs = window.appStorage ? window.appStorage.prefs : {};
  const currentAvatar = prefs.userAvatar || '🦁';

  // Badge Header
  const headerAvatar = document.getElementById('header-avatar-badge');
  if (headerAvatar) headerAvatar.textContent = currentAvatar;

  // Avatar dans le tiroir
  const drawerAvatar = document.getElementById('drawer-avatar-display');
  if (drawerAvatar) drawerAvatar.textContent = currentAvatar;

  // Options actives dans la grille
  document.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-avatar') === currentAvatar);
  });
}

function updateProfileDrawerData() {
  const prefs = window.appStorage ? window.appStorage.prefs : {};
  updateAvatarDisplay();

  // Rendu de la liste des profils utilisateurs
  try { renderDrawerProfilesList(); } catch (e) { console.warn('Profiles list error:', e); }

  const isConnected = !!(prefs.syncUserId && prefs.syncUserPin);

  // Bascule Vue Connecté vs Formulaire de connexion
  const connectedView = document.getElementById('drawer-connected-view');
  const loginView = document.getElementById('drawer-login-view');
  const connectedAvatar = document.getElementById('drawer-connected-avatar');
  const connectedName = document.getElementById('drawer-connected-name');
  const usernameDisplay = document.getElementById('drawer-username-display');

  if (connectedView && loginView) {
    if (isConnected) {
      connectedView.style.display = 'block';
      loginView.style.display = 'none';
      if (connectedAvatar) connectedAvatar.textContent = prefs.userAvatar || '🦁';
      if (connectedName) connectedName.textContent = `@${prefs.syncUserId}`;
    } else {
      connectedView.style.display = 'none';
      loginView.style.display = 'block';
    }
  }

  // Pseudo et mot de passe inputs
  const inputUser = document.getElementById('drawer-input-user');
  const inputPin = document.getElementById('drawer-input-pin');

  const activeProf = window.appStorage ? window.appStorage.getActiveProfile() : null;
  if (usernameDisplay) {
    usernameDisplay.textContent = activeProf ? `Profil : ${activeProf.name}` : (isConnected ? `Profil : ${prefs.syncUserId}` : 'Mon Profil');
  }
  if (inputUser) inputUser.value = prefs.syncUserId || '';
  if (inputPin) inputPin.value = prefs.syncUserPin || '';

  // Statut synchronisation
  const syncDot = document.getElementById('drawer-sync-dot');
  const syncText = document.getElementById('drawer-sync-text');
  if (syncDot && syncText) {
    syncDot.className = 'sync-dot';
    if (isConnected) {
      syncDot.classList.add('success');
      syncText.textContent = `Connecté (${prefs.syncUserId})`;
    } else {
      syncDot.classList.add('idle');
      syncText.textContent = 'Non connecté';
    }
  }

  // Mini statistiques en direct
  try {
    const streakStats = window.appStorage.getStreakStats ? window.appStorage.getStreakStats() : { currentStreak: 0 };
    const totalWorkouts = window.appStorage.getTotalWorkouts ? window.appStorage.getTotalWorkouts() : 0;
    const weightStats = window.appStorage.getWeightStats ? window.appStorage.getWeightStats() : {};
    const latestWeight = window.appStorage.getLatestWeight ? window.appStorage.getLatestWeight() : null;

    const dStreak = document.getElementById('d-stat-streak');
    const dWorkouts = document.getElementById('d-stat-workouts');
    const dWeight = document.getElementById('d-stat-weight');

    if (dStreak) dStreak.textContent = `${streakStats.currentStreak || 0} j`;
    if (dWorkouts) dWorkouts.textContent = totalWorkouts || 0;
    if (dWeight) {
      if (latestWeight && latestWeight.weight) {
        dWeight.textContent = `${latestWeight.weight} kg`;
      } else if (weightStats && weightStats.currentWeight) {
        dWeight.textContent = `${weightStats.currentWeight} kg`;
      } else {
        dWeight.textContent = '-- kg';
      }
    }
  } catch (e) {
    console.warn('Erreur affichage stats drawer:', e);
  }
}

function disconnectProfile() {
  showConfirmModal(
    'Déconnexion du profil Cloud ?',
    'Vous pourrez vous reconnecter à tout moment avec votre Nom de profil et Mot de passe.',
    '🚪',
    () => {
      window.appStorage.savePreferences({
        syncUserId: '',
        syncUserPin: '',
        syncLastTime: null
      });
      const setUserId = document.getElementById('sync-user-id');
      const setUserPin = document.getElementById('sync-user-pin');
      if (setUserId) setUserId.value = '';
      if (setUserPin) setUserPin.value = '';
      if (window.syncManager) {
        window.syncManager.updateStatusUI();
      }
      updateProfileDrawerData();
      if (typeof showToast === 'function') showToast('Profil déconnecté.');
    }
  );
}

async function saveAndSyncFromDrawer() {
  const isConnected = !!(window.appStorage.prefs.syncUserId && window.appStorage.prefs.syncUserPin);
  const inputUser = document.getElementById('drawer-input-user');
  const inputPin = document.getElementById('drawer-input-pin');
  const btnSync = document.getElementById('drawer-btn-sync');
  const btnSyncActive = document.getElementById('drawer-btn-sync-active');

  let userId = '';
  let pin = '';

  if (isConnected) {
    userId = window.appStorage.prefs.syncUserId;
    pin = window.appStorage.prefs.syncUserPin;
  } else {
    userId = inputUser ? inputUser.value.trim().toLowerCase() : '';
    pin = inputPin ? inputPin.value.trim() : '';
  }

  if (!userId || !pin) {
    if (typeof showToast === 'function') showToast("⚠️ Renseignez votre Nom de Profil et Mot de passe.", true);
    return;
  }

  if (pin.length < 3) {
    if (typeof showToast === 'function') showToast("⚠️ Le mot de passe doit comporter au moins 3 caractères.", true);
    return;
  }

  const targetBtn = btnSyncActive || btnSync;
  if (targetBtn) {
    targetBtn.disabled = true;
    targetBtn.innerHTML = '⏳ Synchronisation...';
  }

  try {
    window.appStorage.savePreferences({
      syncUserId: userId,
      syncUserPin: pin,
      syncAutoEnabled: true
    });

    const setUserId = document.getElementById('sync-user-id');
    const setUserPin = document.getElementById('sync-user-pin');
    if (setUserId) setUserId.value = userId;
    if (setUserPin) setUserPin.value = pin;

    await window.syncManager.sync();
    updateProfileDrawerData();
  } finally {
    if (targetBtn) {
      targetBtn.disabled = false;
      targetBtn.innerHTML = isConnected ? '⚡ Synchroniser maintenant' : '⚡ Se Connecter / Synchro';
    }
  }
}

async function pullFromDrawer() {
  const isConnected = !!(window.appStorage.prefs.syncUserId && window.appStorage.prefs.syncUserPin);
  const inputUser = document.getElementById('drawer-input-user');
  const inputPin = document.getElementById('drawer-input-pin');

  let userId = isConnected ? window.appStorage.prefs.syncUserId : (inputUser ? inputUser.value.trim().toLowerCase() : '');
  let pin = isConnected ? window.appStorage.prefs.syncUserPin : (inputPin ? inputPin.value.trim() : '');

  if (!userId || !pin) {
    if (typeof showToast === 'function') showToast("⚠️ Renseignez votre Nom de Profil et Mot de passe.", true);
    return;
  }

  window.appStorage.savePreferences({
    syncUserId: userId,
    syncUserPin: pin,
    syncAutoEnabled: true
  });

  await window.syncManager.pullFromCloud();
  updateProfileDrawerData();
}

// --------------------------------------------------------------------------
// MULTI-UTILISATEURS & GESTION DES PROFILS
// --------------------------------------------------------------------------
function renderDrawerProfilesList() {
  const container = document.getElementById('drawer-profiles-list');
  if (!container || !window.appStorage) return;

  const profiles = window.appStorage.getProfiles();
  const activeId = window.appStorage.getActiveProfileId();

  container.innerHTML = profiles.map(prof => {
    const isActive = prof.id === activeId;
    const levelNames = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé', custom: 'Sur-mesure' };
    const levelText = levelNames[prof.level] || 'Intermédiaire';

    return `
      <div class="profile-card-item ${isActive ? 'active' : ''}" onclick="switchUserProfile('${prof.id}')">
        <div class="profile-card-left">
          <span class="profile-card-avatar">${prof.avatar || '⚡'}</span>
          <div class="profile-card-info">
            <span class="profile-card-name">${prof.name}</span>
            <span class="profile-card-badge">${levelText}</span>
          </div>
        </div>
        <div class="profile-card-actions" onclick="event.stopPropagation();">
          ${isActive ? '<span style="color: var(--accent-work); font-size: 0.82rem; font-weight: 800;">✓ Actif</span>' : `<button class="btn-secondary" style="padding: 4px 10px; font-size: 0.72rem; width: auto;" onclick="switchUserProfile('${prof.id}')">Choisir</button>`}
          ${profiles.length > 1 && !isActive ? `<button class="btn-profile-delete" onclick="deleteUserProfile('${prof.id}', '${prof.name.replace(/'/g, "\\'")}')" title="Supprimer ce profil">🗑️</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

let _newProfAvatar = '⚡';
let _newProfLevel = 'intermediate';

function openNewProfileModal() {
  const modal = document.getElementById('new-profile-modal');
  const nameInput = document.getElementById('new-prof-name');
  _newProfAvatar = '⚡';
  _newProfLevel = 'intermediate';

  if (nameInput) nameInput.value = '';
  selectNewProfileAvatar(_newProfAvatar);
  selectNewProfileLevel(_newProfLevel);

  if (modal) modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeNewProfileModal() {
  const modal = document.getElementById('new-profile-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function selectNewProfileAvatar(avatar) {
  _newProfAvatar = avatar;
  document.querySelectorAll('#new-prof-avatar-grid .avatar-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-avatar') === avatar);
  });
}

function selectNewProfileLevel(level) {
  _newProfLevel = level;
  document.querySelectorAll('#new-prof-level-grid .level-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-level') === level);
  });
}

function confirmCreateNewProfile() {
  const nameInput = document.getElementById('new-prof-name');
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    if (typeof showToast === 'function') showToast("⚠️ Veuillez saisir un nom pour le profil.", true);
    return;
  }

  const newProf = window.appStorage.createProfile({
    name,
    avatar: _newProfAvatar,
    level: _newProfLevel
  });

  closeNewProfileModal();
  switchUserProfile(newProf.id);
  if (typeof showToast === 'function') showToast(`🎉 Profil créé : ${newProf.name} !`);
}

function switchUserProfile(profileId) {
  if (!window.appStorage) return;
  const prof = window.appStorage.switchProfile(profileId);
  if (!prof) return;

  reInitAppState();
  if (typeof showToast === 'function') {
    showToast(`Profil actif : ${prof.name} ${prof.avatar}`);
  }
}

function deleteUserProfile(profileId, profileName) {
  showConfirmModal(
    `Supprimer le profil "${profileName}" ?`,
    'Toutes les données, séries et pesées de cet utilisateur seront effacées.',
    '🗑️',
    () => {
      window.appStorage.deleteProfile(profileId);
      reInitAppState();
      if (typeof showToast === 'function') showToast('Profil supprimé.');
    }
  );
}

function reInitAppState() {
  // 1. Initialiser le thème
  try {
    const savedTheme = window.appStorage.prefs.theme || 'dark';
    const resolvedTheme = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    const themeSelect = document.getElementById('setting-theme');
    if (themeSelect) themeSelect.value = savedTheme;
  } catch (e) {}

  // 2. Formulaire & Avatars
  try { loadSettingsForm(); } catch (e) {}
  try { updateAvatarDisplay(); } catch (e) {}

  // 3. Exercices Accueil
  try { renderHomeExercisesList(); } catch (e) {}

  // 4. Horloge 17h
  try { startLiveClock(); } catch (e) {}

  // 5. Dashboard & Badges
  try { if (window.dashboardManager) window.dashboardManager.renderDashboard(); } catch (e) {}
  try { if (window.motivationManager) window.motivationManager.renderBadgesView(); } catch (e) {}

  // 6. Drawer profil
  try { updateProfileDrawerData(); } catch (e) {}
}

// --------------------------------------------------------------------------
// SÉLECTION PERSONNALISÉE DES EXERCICES (ROUTINE SUR MESURE)
// --------------------------------------------------------------------------
let _customSelectedExerciseIds = [];
let _activePickerFilter = 'all';

function openCustomExercisesModal() {
  const modal = document.getElementById('custom-exercises-modal');
  if (!modal || !window.appStorage) return;

  const prefs = window.appStorage.prefs;
  if (Array.isArray(prefs.customExerciseIds) && prefs.customExerciseIds.length > 0) {
    _customSelectedExerciseIds = [...prefs.customExerciseIds].filter(id => id !== 9);
  } else {
    const currentExercises = typeof window.getActiveWorkoutExercises === 'function'
      ? window.getActiveWorkoutExercises(prefs)
      : (window.EXERCISES_DATA || []);
    _customSelectedExerciseIds = currentExercises.filter(e => !e.isCoolDown).map(e => e.id);
  }

  _activePickerFilter = 'all';
  document.querySelectorAll('#custom-ex-filter-bar .filter-pill-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
  });

  renderCustomExercisesPickerList();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeCustomExercisesModal() {
  const modal = document.getElementById('custom-exercises-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function filterCustomExercisesList(filter) {
  _activePickerFilter = filter;
  document.querySelectorAll('#custom-ex-filter-bar .filter-pill-opt').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderCustomExercisesPickerList();
}

function renderCustomExercisesPickerList() {
  const container = document.getElementById('custom-exercise-picker-list');
  const summaryEl = document.getElementById('custom-ex-selection-summary');
  if (!container) return;

  const allExercises = typeof window.getAllExercises === 'function' ? window.getAllExercises() : (window.EXERCISES_DATA || []);
  const pickerCandidates = allExercises.filter(e => !e.isCoolDown);

  let filtered = pickerCandidates;
  if (_activePickerFilter !== 'all') {
    if (['beginner', 'intermediate', 'advanced'].includes(_activePickerFilter)) {
      filtered = pickerCandidates.filter(e => e.level === _activePickerFilter);
    } else {
      filtered = pickerCandidates.filter(e => e.category === _activePickerFilter);
    }
  }

  if (summaryEl) {
    summaryEl.textContent = `${_customSelectedExerciseIds.length} exercice(s) dans le circuit (+ Étirements)`;
  }

  container.innerHTML = filtered.map(ex => {
    const isSelected = _customSelectedExerciseIds.includes(ex.id);
    const levelClass = ex.level || 'intermediate';

    return `
      <div class="exercise-picker-item ${isSelected ? 'selected' : ''}" data-ex-id="${ex.id}" onclick="toggleCustomExerciseSelection(${ex.id})">
        <div class="picker-item-left">
          <input type="checkbox" class="picker-item-checkbox" ${isSelected ? 'checked' : ''} tabindex="-1">
          <div class="picker-item-info">
            <div class="picker-item-name">${ex.number}. ${ex.name}</div>
            <div class="picker-item-sub">${ex.subtitle}</div>
            <div class="picker-item-tags">
              <span class="badge-tag-level ${levelClass}">${ex.levelLabel || 'Standard'}</span>
              <span class="badge-tag-level" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${ex.targetPrimary}</span>
            </div>
          </div>
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">
          ${ex.duration}s
        </div>
      </div>
    `;
  }).join('');
}

function toggleCustomExerciseSelection(exerciseId) {
  const id = Number(exerciseId);
  const index = _customSelectedExerciseIds.indexOf(id);
  if (index >= 0) {
    if (_customSelectedExerciseIds.length <= 1) {
      if (typeof showToast === 'function') showToast("⚠️ Vous devez garder au moins 1 exercice dans votre séance.", true);
      return;
    }
    _customSelectedExerciseIds.splice(index, 1);
  } else {
    _customSelectedExerciseIds.push(id);
  }
  renderCustomExercisesPickerList();
}

function resetRoutineToActiveLevel() {
  const prefs = window.appStorage ? window.appStorage.prefs : {};
  const currentLevel = prefs.userLevel === 'custom' ? 'intermediate' : (prefs.userLevel || 'intermediate');
  const levelExercises = typeof window.getExercisesForLevel === 'function'
    ? window.getExercisesForLevel(currentLevel)
    : (window.EXERCISES_DATA || []);

  _customSelectedExerciseIds = levelExercises.filter(e => !e.isCoolDown).map(e => e.id);
  renderCustomExercisesPickerList();
  if (typeof showToast === 'function') showToast(`Réinitialisé sur le niveau ${currentLevel}`);
}

function saveCustomWorkoutSelection() {
  if (!_customSelectedExerciseIds || _customSelectedExerciseIds.length === 0) {
    if (typeof showToast === 'function') showToast("⚠️ Veuillez sélectionner au moins 1 exercice.", true);
    return;
  }

  const cleanIds = [...new Set(_customSelectedExerciseIds.map(Number))].filter(id => id >= 1 && id <= 20 && id !== 9);

  if (cleanIds.length === 0) {
    if (typeof showToast === 'function') showToast("⚠️ Veuillez sélectionner au moins 1 exercice.", true);
    return;
  }

  window.appStorage.savePreferences({
    userLevel: 'custom',
    customExerciseIds: cleanIds
  });

  closeCustomExercisesModal();
  renderHomeExercisesList();
  if (typeof updateProfileDrawerData === 'function') {
    updateProfileDrawerData();
  }
  if (typeof showToast === 'function') {
    showToast(`✨ Routine sur-mesure validée (${cleanIds.length} exercices) !`);
  }
}

// Exports globaux
window.openProfileDrawer = openProfileDrawer;
window.closeProfileDrawer = closeProfileDrawer;
window.selectAvatar = selectAvatar;
window.updateAvatarDisplay = updateAvatarDisplay;
window.updateProfileDrawerData = updateProfileDrawerData;
window.disconnectProfile = disconnectProfile;
window.saveAndSyncFromDrawer = saveAndSyncFromDrawer;
window.pullFromDrawer = pullFromDrawer;
window.setUserLevel = setUserLevel;
window.renderDrawerProfilesList = renderDrawerProfilesList;
window.openNewProfileModal = openNewProfileModal;
window.closeNewProfileModal = closeNewProfileModal;
window.selectNewProfileAvatar = selectNewProfileAvatar;
window.selectNewProfileLevel = selectNewProfileLevel;
window.confirmCreateNewProfile = confirmCreateNewProfile;
window.switchUserProfile = switchUserProfile;
window.deleteUserProfile = deleteUserProfile;
window.openCustomExercisesModal = openCustomExercisesModal;
window.closeCustomExercisesModal = closeCustomExercisesModal;
window.filterCustomExercisesList = filterCustomExercisesList;
window.toggleCustomExerciseSelection = toggleCustomExerciseSelection;
window.resetRoutineToActiveLevel = resetRoutineToActiveLevel;
window.saveCustomWorkoutSelection = saveCustomWorkoutSelection;
window.reInitAppState = reInitAppState;





