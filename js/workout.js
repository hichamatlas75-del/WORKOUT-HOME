/**
 * FULL BODY 17 — MOTEUR D'ENTRAÎNEMENT & CHRONOMÈTRE
 * Gestion des cycles Effort / Repos / Tours, Synchronisation Audio et Wake Lock.
 */

const WORKOUT_STATES = {
  IDLE: 'IDLE',
  PREPARE: 'PREPARE',
  WORK: 'WORK',
  REST: 'REST',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
};

class WorkoutEngine {
  constructor() {
    this.state = WORKOUT_STATES.IDLE;
    this.previousState = null;

    this.currentRound = 1;
    this.totalRounds = 2;
    this.currentExerciseIndex = 0; // 0 à 5

    this.timeRemaining = 0;
    this.totalPhaseDuration = 0;
    this.workoutStartTime = null;
    this.elapsedSeconds = 0;

    this.timerInterval = null;
    this.lastTickTime = null;
    this.wakeLock = null;

    this.onTick = null;
    this.onStateChange = null;
    this.onFinish = null;

    // Constante périmètre cercle SVG (2 * PI * 110)
    this.CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 110;
  }

  // Démarrer une nouvelle séance
  startWorkout(options = {}) {
    const prefs = window.appStorage.prefs;
    this.totalRounds = options.rounds || prefs.rounds || 2;
    this.workDuration = options.workDuration || prefs.workDuration || 40;
    this.restDuration = options.restDuration || prefs.restDuration || 20;

    this.currentRound = 1;
    this.currentExerciseIndex = 0;
    this.elapsedSeconds = 0;
    this.workoutStartTime = Date.now();

    // Activer le maintien de l'écran allumé (Wake Lock)
    this.requestWakeLock();

    // Démarrage par la phase de préparation (5 secondes)
    this.setPhase(WORKOUT_STATES.PREPARE, 5);
    this.startTimerLoop();

    const firstEx = EXERCISES_DATA[0];
    window.audioEngine.speak(`Préparez-vous. Premier exercice : ${firstEx.name}`);
  }

  // Basculement d'état / de phase
  setPhase(newState, duration) {
    this.state = newState;
    this.timeRemaining = duration;
    this.totalPhaseDuration = duration;
    this.phaseEndTime = Date.now() + duration * 1000;

    // Mise à jour visuelle des classes du conteneur
    const overlay = document.getElementById('workout-overlay');
    if (overlay) {
      overlay.classList.remove('state-work', 'state-rest', 'state-prep');
      if (newState === WORKOUT_STATES.WORK) overlay.classList.add('state-work');
      if (newState === WORKOUT_STATES.REST) overlay.classList.add('state-rest');
      if (newState === WORKOUT_STATES.PREPARE) overlay.classList.add('state-prep');
    }

    if (this.onStateChange) {
      this.onStateChange(this.state, this.getCurrentInfo());
    }
  }

  // Boucle de chronométrage robuste (résistant au throttle en arrière-plan)
  startTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phaseEndTime = Date.now() + this.timeRemaining * 1000;

    this.timerInterval = setInterval(() => {
      if (this.state === WORKOUT_STATES.PAUSED || this.state === WORKOUT_STATES.IDLE) return;

      const now = Date.now();
      this.timeRemaining = Math.max(0, (this.phaseEndTime - now) / 1000);
      this.elapsedSeconds = (now - this.workoutStartTime) / 1000;

      const ceilSec = Math.ceil(this.timeRemaining);

      // Signaux sonores à 3s, 2s, 1s
      if (this.timeRemaining <= 3.05 && this.timeRemaining > 0) {
        const checkSec = Math.ceil(this.timeRemaining);
        if (checkSec !== this.lastBeepSec && checkSec >= 1 && checkSec <= 3) {
          window.audioEngine.playCountdownBeep(checkSec);
          this.lastBeepSec = checkSec;
        }
      }

      // Signal de mi-temps à 20s pour les exercices unilatéraux (06. Extension de hanche debout)
      if (this.state === WORKOUT_STATES.WORK && (this.currentExerciseIndex === 5)) {
        if (Math.abs(this.timeRemaining - 20) < 0.15 && !this.halfTimeTriggered) {
          window.audioEngine.playHalfTimeTone();
          window.audioEngine.speak("Mi-temps, changez de jambe");
          this.halfTimeTriggered = true;
        }
      }

      // Diffusion d'état toutes les secondes pour l'écran TV
      if (ceilSec !== this._lastBroadcastSec) {
        this._lastBroadcastSec = ceilSec;
        this.broadcastCastState();
      }

      // Fin de la phase actuelle
      if (this.timeRemaining <= 0) {
        this.lastBeepSec = null;
        this.halfTimeTriggered = false;
        this.advanceStep();
      }

      if (this.onTick) {
        this.onTick(this.timeRemaining, this.totalPhaseDuration, this.getCurrentInfo());
      }
    }, 100);
  }

  // Nombre d'exercices du circuit principal (hors retour au calme)
  getMainCircuitCount() {
    return EXERCISES_DATA.filter(e => !e.isCoolDown).length; // 7
  }

  // Obtenir la durée spécifique d'un exercice (ex: 30s, 45s, 60s, 120s pour la Planche)
  getExerciseDuration(index) {
    const ex = EXERCISES_DATA[index];
    if (ex && ex.isPlank) {
      return parseInt(window.appStorage.prefs.plankDuration) || 45;
    }
    return this.workDuration;
  }

  // Transition vers l'étape suivante de la séance
  advanceStep() {
    if (this.state === WORKOUT_STATES.PREPARE) {
      // Fin de la préparation -> Début de l'exercice 1
      const duration = this.getExerciseDuration(this.currentExerciseIndex);
      this.setPhase(WORKOUT_STATES.WORK, duration);
      window.audioEngine.playGoTone();
      // Feedback haptique
      if ('vibrate' in navigator) navigator.vibrate(150);
      const ex = EXERCISES_DATA[this.currentExerciseIndex];
      window.audioEngine.speak(`${ex.name}, série ${this.currentRound}, c'est parti pour ${duration} secondes`);
      return;
    }

    if (this.state === WORKOUT_STATES.WORK) {
      const mainCount = this.getMainCircuitCount();
      const currentEx = EXERCISES_DATA[this.currentExerciseIndex];

      // Si on vient de finir l'étirement final -> Fin de séance
      if (currentEx && currentEx.isCoolDown) {
        this.completeWorkout();
        return;
      }

      const isLastOfCircuit = this.currentExerciseIndex === mainCount - 1;
      const isLastRound = this.currentRound === this.totalRounds;

      // Passage en Récupération (20s)
      this.setPhase(WORKOUT_STATES.REST, this.restDuration);
      window.audioEngine.playRestTone();

      // Déterminer le prochain exercice pour l'annonce vocale
      if (isLastOfCircuit) {
        if (isLastRound) {
          window.audioEngine.speak(`3 séries terminées ! Repos 20 secondes. Place au retour au calme : Étirements.`);
        } else {
          window.audioEngine.speak(`Fin du tour ${this.currentRound}. Repos 20 secondes. Préparez-vous pour le tour ${this.currentRound + 1}.`);
        }
      } else {
        const nextEx = EXERCISES_DATA[this.currentExerciseIndex + 1];
        window.audioEngine.speak(`Récupération 20 secondes. Prochain exercice : ${nextEx.name}`);
      }
      return;
    }

    if (this.state === WORKOUT_STATES.REST) {
      const mainCount = this.getMainCircuitCount();
      const isLastOfCircuit = this.currentExerciseIndex === mainCount - 1;

      if (isLastOfCircuit) {
        if (this.currentRound < this.totalRounds) {
          this.currentRound++;
          this.currentExerciseIndex = 0;
        } else {
          // Passer aux étirements finaux
          this.currentExerciseIndex = mainCount;
        }
      } else {
        this.currentExerciseIndex++;
      }

      const duration = this.getExerciseDuration(this.currentExerciseIndex);
      this.setPhase(WORKOUT_STATES.WORK, duration);
      window.audioEngine.playGoTone();
      // Feedback haptique au début de l'exercice
      if ('vibrate' in navigator) navigator.vibrate(150);
      const ex = EXERCISES_DATA[this.currentExerciseIndex];
      window.audioEngine.speak(`${ex.name}${ex.isPlank ? ` pour ${duration} secondes` : ''}`);
    }
  }

  // Sauter manuellement à l'exercice suivant
  skipNext() {
    this.lastBeepSec = null;
    this.halfTimeTriggered = false;
    this.advanceStep();
  }

  // Revenir en arrière
  previousStep() {
    const mainCount = this.getMainCircuitCount();
    if (this.currentExerciseIndex === mainCount) {
      // Depuis les étirements -> revenir au dernier exercice du dernier tour
      this.currentRound = this.totalRounds;
      this.currentExerciseIndex = mainCount - 1;
    } else if (this.currentExerciseIndex > 0) {
      this.currentExerciseIndex--;
    } else if (this.currentRound > 1) {
      this.currentRound--;
      this.currentExerciseIndex = mainCount - 1;
    }
    const duration = this.getExerciseDuration(this.currentExerciseIndex);
    this.setPhase(WORKOUT_STATES.WORK, duration);
    window.audioEngine.playGoTone();
  }

  // Mettre en pause / Reprendre
  togglePause() {
    if (this.state === WORKOUT_STATES.PAUSED) {
      this.state = this.previousState || WORKOUT_STATES.WORK;
      // Recalculer l'heure de fin après la pause et relancer la boucle
      this.phaseEndTime = Date.now() + this.timeRemaining * 1000;
      this.startTimerLoop();
      if (this.onStateChange) this.onStateChange(this.state, this.getCurrentInfo());
    } else if (this.state === WORKOUT_STATES.WORK || this.state === WORKOUT_STATES.REST || this.state === WORKOUT_STATES.PREPARE) {
      this.previousState = this.state;
      this.state = WORKOUT_STATES.PAUSED;
      // Arrêter la boucle pendant la pause pour économiser CPU/batterie
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      if (this.onStateChange) this.onStateChange(this.state, this.getCurrentInfo());
    }
  }

  // Terminer la séance avec succès
  completeWorkout() {
    this.state = WORKOUT_STATES.COMPLETED;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.releaseWakeLock();

    const actualDurationSec = Math.round(this.elapsedSeconds);

    // Enregistrement dans le stockage local
    const session = window.appStorage.addWorkoutSession({
      durationSeconds: actualDurationSec,
      rounds: this.totalRounds,
      completed: true,
      exercisesCount: EXERCISES_DATA.length
    });

    // Sons & Voix de victoire
    window.audioEngine.playVictoryFanfare();
    // Feedback haptique de victoire
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
    window.audioEngine.speak("Félicitations ! Séance terminée avec succès.");

    if (this.onFinish) {
      this.onFinish(session);
    }
  }

  // Abandonner / Quitter la séance en cours
  quitWorkout() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.releaseWakeLock();
    this.state = WORKOUT_STATES.IDLE;
  }

  // Données de l'état actuel pour l'interface
  getCurrentInfo() {
    const mainCount = this.getMainCircuitCount();
    const currentEx = EXERCISES_DATA[this.currentExerciseIndex] || EXERCISES_DATA[0];
    const isCoolDown = !!currentEx.isCoolDown;

    let nextIndex;
    if (isCoolDown) {
      nextIndex = null;
    } else if (this.currentExerciseIndex === mainCount - 1) {
      nextIndex = (this.currentRound === this.totalRounds) ? mainCount : 0;
    } else {
      nextIndex = this.currentExerciseIndex + 1;
    }
    const nextEx = nextIndex !== null ? EXERCISES_DATA[nextIndex] : null;

    return {
      state: this.state,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      isCoolDown: isCoolDown,
      roundLabel: isCoolDown ? 'RETOUR AU CALME' : `SÉRIE ${this.currentRound} / ${this.totalRounds}`,
      stepLabel: isCoolDown ? 'ÉTIR. (1 SÉRIE)' : `${this.currentExerciseIndex + 1} / ${mainCount}`,
      exerciseIndex: this.currentExerciseIndex + 1,
      totalExercises: EXERCISES_DATA.length,
      currentExercise: currentEx,
      nextExercise: nextEx,
      timeRemaining: Math.ceil(this.timeRemaining),
      progressFraction: this.totalPhaseDuration > 0 ? (this.timeRemaining / this.totalPhaseDuration) : 0,
      elapsedSeconds: Math.round(this.elapsedSeconds)
    };
  }

  // Maintien de l'écran allumé (Screen Wake Lock API) avec récupération automatique
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        // Récupération automatique du Wake Lock si relâché par le système
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }

    // Récupérer le Wake Lock quand l'app redevient visible
    if (!this._visibilityListenerAdded) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' &&
            this.state !== WORKOUT_STATES.IDLE &&
            this.state !== WORKOUT_STATES.COMPLETED) {
          this.requestWakeLock();
        }
      });
      this._visibilityListenerAdded = true;
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().then(() => {
        this.wakeLock = null;
      }).catch(() => {});
    }
  }
}

window.workoutEngine = new WorkoutEngine();
