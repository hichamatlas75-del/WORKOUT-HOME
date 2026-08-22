/**
 * FULL BODY 17 — APPLICATION PRINCIPALE & ROUTEUR D'INTERFACE
 * Liaison de tous les composants, navigation, compte à rebours 17:00 et modales.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialiser le thème (Sombre par défaut ou sauvegardé)
  const savedTheme = window.appStorage.prefs.theme || 'dark';
  const resolvedTheme = savedTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedTheme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  const themeSelect = document.getElementById('setting-theme');
  if (themeSelect) themeSelect.value = savedTheme;

  // 2. Initialiser les réglages dans le formulaire
  loadSettingsForm();

  // 3. Initialiser la liste des exercices sur la vue d'accueil
  renderHomeExercisesList();

  // 4. Initialiser la navigation par onglets
  initTabNavigation();

  // 5. Initialiser les écouteurs de la séance en direct
  initWorkoutUI();

  // 6. Démarrer le compte à rebours 17:00 en direct
  startLiveClock();

  // 7. Initialiser les notifications & rappels
  window.notificationManager.startReminderWatcher();

  // 8. Rendu initial du tableau de bord & badges
  window.dashboardManager.renderDashboard();
  window.motivationManager.renderBadgesView();

  // 9. Vérifier les paramètres URL (ex: ?action=start)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'start') {
    startWorkoutSession();
  } else if (urlParams.get('tab')) {
    switchTab(urlParams.get('tab'));
  }
});

// --------------------------------------------------------------------------
// GESTION DU COMPTE À REBOURS 17:00 (ACCUEIL)
// --------------------------------------------------------------------------
function startLiveClock() {
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
  setInterval(updateClock, 30000);
}

// --------------------------------------------------------------------------
// LISTE DES 7 EXERCICES SUR L'ACCUEIL
// --------------------------------------------------------------------------
function renderHomeExercisesList() {
  const container = document.getElementById('home-exercise-list');
  if (!container) return;

  const prefs = window.appStorage.prefs;

  container.innerHTML = EXERCISES_DATA.map(ex => {
    const durationDisplay = ex.isPlank 
      ? (prefs.plankDuration == 120 ? '2 min' : `${prefs.plankDuration || 45}s`)
      : `${ex.duration}s`;

    return `
      <div class="exercise-item-card" onclick="openExerciseModal(${ex.id})">
        <div class="ex-thumb-container">
          <img src="${ex.image}" alt="${ex.name}" class="ex-thumb-img" loading="lazy">
          <span class="ex-thumb-badge">${ex.number}</span>
        </div>
        <div class="ex-info">
          <div class="ex-name">${ex.name}</div>
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

// --------------------------------------------------------------------------
// MODALE DÉTAILLÉE D'UN EXERCICE
// --------------------------------------------------------------------------
function openExerciseModal(exerciseId) {
  const ex = EXERCISES_DATA.find(e => e.id === exerciseId);
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
  if (numberEl) numberEl.textContent = `Exercice ${ex.number}/08 • ${durationDisplay}`;
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

// --------------------------------------------------------------------------
// MOTEUR D'ENTRAÎNEMENT & WORKOUT UI
// --------------------------------------------------------------------------
function startWorkoutSession() {
  window.audioEngine.initContext();
  const overlay = document.getElementById('workout-overlay');
  if (overlay) overlay.classList.add('active');

  // Intercepter le bouton Retour Android
  history.pushState({ workout: true }, '', '');

  window.workoutEngine.startWorkout({
    rounds: parseInt(window.appStorage.prefs.rounds) || 2,
    workDuration: parseInt(window.appStorage.prefs.workDuration) || 40,
    restDuration: parseInt(window.appStorage.prefs.restDuration) || 20
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
      syncWorkoutMedia(state, illustrationBox);
    } else if (state === WORKOUT_STATES.WORK) {
      if (timerBadge) timerBadge.textContent = "EFFORT";
      if (exerciseName) exerciseName.textContent = info.currentExercise.name;
      if (exerciseCue) exerciseCue.textContent = info.currentExercise.cue;
      if (illustrationBox) illustrationBox.innerHTML = info.currentExercise.illustrationHtml;
      if (nextBox) nextBox.innerHTML = `<span>À suivre :</span> <strong>${info.nextExercise.name}</strong>`;
      syncWorkoutMedia(state, illustrationBox);
    } else if (state === WORKOUT_STATES.REST) {
      if (timerBadge) timerBadge.textContent = "RÉCUPÉRATION";
      if (exerciseName) exerciseName.textContent = "REPOS & RESPIRATION";
      if (exerciseCue) exerciseCue.textContent = "Inspirez profondément, relâchez les épaules";
      if (illustrationBox) illustrationBox.innerHTML = info.nextExercise.illustrationHtml;
      if (nextBox) nextBox.innerHTML = `<span>Prochain :</span> <strong>${info.nextExercise.name}</strong>`;
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

function prevWorkoutExercise() {
  window.workoutEngine.previousStep();
}

function confirmQuitWorkout() {
  if (confirm("Voulez-vous vraiment interrompre la séance en cours ?")) {
    window.workoutEngine.quitWorkout();
    const overlay = document.getElementById('workout-overlay');
    if (overlay) overlay.classList.remove('active');
  }
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
  const reminderSwitch = document.getElementById('setting-reminder');

  if (timeInput) timeInput.value = prefs.targetTime || "17:00";
  if (roundsInput) roundsInput.value = prefs.rounds || 3;
  if (plankInput) plankInput.value = prefs.plankDuration || 45;
  if (workInput) workInput.value = prefs.workDuration || 40;
  if (restInput) restInput.value = prefs.restDuration || 20;
  if (soundSwitch) soundSwitch.checked = prefs.soundEnabled !== false;
  if (voiceSwitch) voiceSwitch.checked = prefs.voiceEnabled !== false;
  if (reminderSwitch) reminderSwitch.checked = prefs.reminderActive !== false;

  window.audioEngine.soundEnabled = prefs.soundEnabled !== false;
  window.audioEngine.voiceEnabled = prefs.voiceEnabled !== false;
}

function saveSettings() {
  const timeInput = document.getElementById('setting-target-time');
  const roundsInput = document.getElementById('setting-rounds');
  const plankInput = document.getElementById('setting-plank-duration');
  const workInput = document.getElementById('setting-work-duration');
  const restInput = document.getElementById('setting-rest-duration');
  const soundSwitch = document.getElementById('setting-sound');
  const voiceSwitch = document.getElementById('setting-voice');
  const reminderSwitch = document.getElementById('setting-reminder');
  const themeSelect = document.getElementById('setting-theme');

  const newPrefs = {
    targetTime: timeInput ? timeInput.value : "17:00",
    rounds: roundsInput ? parseInt(roundsInput.value) : 3,
    plankDuration: plankInput ? parseInt(plankInput.value) : 45,
    workDuration: workInput ? parseInt(workInput.value) : 40,
    restDuration: restInput ? parseInt(restInput.value) : 20,
    soundEnabled: soundSwitch ? soundSwitch.checked : true,
    voiceEnabled: voiceSwitch ? voiceSwitch.checked : true,
    reminderActive: reminderSwitch ? reminderSwitch.checked : true,
    theme: themeSelect ? themeSelect.value : "dark"
  };

  window.appStorage.savePreferences(newPrefs);
  const resolvedTheme = newPrefs.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : newPrefs.theme;
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  window.audioEngine.soundEnabled = newPrefs.soundEnabled;
  window.audioEngine.voiceEnabled = newPrefs.voiceEnabled;

  // Mise à jour de l'affichage de l'accueil
  const targetDisplay = document.getElementById('hero-target-display');
  if (targetDisplay) targetDisplay.textContent = newPrefs.targetTime;

  renderHomeExercisesList();

  showToast("✅ Réglages enregistrés avec succès !");
}

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
      location.reload();
    } else {
      showToast("❌ Fichier de sauvegarde invalide.", true);
    }
  };
  reader.readAsText(file);
}

function confirmResetData() {
  if (confirm("⚠️ Attention : Voulez-vous vraiment effacer tout votre historique et vos statistiques ? Cette action est irréversible.")) {
    window.appStorage.clearAllData();
    showToast("Données réinitialisées.");
    location.reload();
  }
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


