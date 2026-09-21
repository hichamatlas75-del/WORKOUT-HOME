import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Synchronisation Audio & Vidéos (audio.js, workout.js, exercises.js)', () => {
  const env = createTestEnvironment();
  env.loadScript('js/exercises.js');
  env.loadScript('js/storage.js');
  env.loadScript('js/audio.js');
  env.loadScript('js/workout.js');

  const EXERCISES_DATA = env.get('EXERCISES_DATA');
  const audioEngine = env.get('window.audioEngine');
  const workoutEngine = env.get('window.workoutEngine');
  const renderExerciseMediaHtml = env.get('renderExerciseMediaHtml');


  test('Attributs vidéo conformes pour la synchronisation fluide sans blocage navigateur', () => {
    for (const ex of EXERCISES_DATA) {
      const html = renderExerciseMediaHtml(ex);
      assert.ok(html.includes('autoplay'), `L'exercice ${ex.name} doit avoir autoplay`);
      assert.ok(html.includes('muted'), `L'exercice ${ex.name} doit être muted pour autoriser l'autoplay`);
      assert.ok(html.includes('playsinline'), `L'exercice ${ex.name} doit avoir playsinline pour mobile`);
      assert.ok(html.includes('loop'), `L'exercice ${ex.name} doit boucler pendant la durée de la série`);
      assert.ok(html.includes(`poster="${ex.image}"`), `L'exercice ${ex.name} doit avoir son poster image`);
      assert.ok(html.includes(`src="${ex.video}"`), `L'exercice ${ex.name} doit cibler sa vidéo mp4`);
      assert.ok(html.includes('onerror='), `L'exercice ${ex.name} doit avoir un fallback automatique Canvas 2D`);
    }
  });

  test('Signaux sonores du moteur Audio (Bips 3-2-1, Départ GO, Repos, Mi-temps, Victoire)', () => {
    assert.ok(audioEngine);
    assert.equal(audioEngine.soundEnabled, true);
    assert.equal(audioEngine.voiceEnabled, true);

    // Test des méthodes de déclenchement sans exception
    assert.doesNotThrow(() => audioEngine.playCountdownBeep(3));
    assert.doesNotThrow(() => audioEngine.playCountdownBeep(2));
    assert.doesNotThrow(() => audioEngine.playCountdownBeep(1));
    assert.doesNotThrow(() => audioEngine.playGoTone());
    assert.doesNotThrow(() => audioEngine.playRestTone());
    assert.doesNotThrow(() => audioEngine.playHalfTimeTone());
    assert.doesNotThrow(() => audioEngine.playVictoryFanfare());
    assert.doesNotThrow(() => audioEngine.speak("Test synchronisation vocale"));
  });

  test('Synchronisation des phases WorkoutEngine avec les signaux Audio', () => {
    const audioEvents = [];

    const origBeep = audioEngine.playCountdownBeep.bind(audioEngine);
    const origGo = audioEngine.playGoTone.bind(audioEngine);
    const origRest = audioEngine.playRestTone.bind(audioEngine);
    const origSpeak = audioEngine.speak.bind(audioEngine);

    audioEngine.playCountdownBeep = (num) => { audioEvents.push({ type: 'beep', num }); };
    audioEngine.playGoTone = () => { audioEvents.push({ type: 'go' }); };
    audioEngine.playRestTone = () => { audioEvents.push({ type: 'rest' }); };
    audioEngine.speak = (text) => { audioEvents.push({ type: 'speak', text }); };

    // Démarrage séance
    workoutEngine.startWorkout({ rounds: 1, workDuration: 10, restDuration: 5 });
    assert.equal(workoutEngine.state, 'PREPARE');

    // Avancer à l'effort
    workoutEngine.advanceStep();
    assert.equal(workoutEngine.state, 'WORK');
    assert.ok(audioEvents.some(e => e.type === 'go'), "Le signal GO doit retentir au début de l'effort");

    // Avancer au repos
    workoutEngine.advanceStep();
    assert.equal(workoutEngine.state, 'REST');
    assert.ok(audioEvents.some(e => e.type === 'rest'), "Le signal REPOS doit retentir à la fin de l'effort");

    // Nettoyage
    workoutEngine.quitWorkout();
    audioEngine.playCountdownBeep = origBeep;
    audioEngine.playGoTone = origGo;
    audioEngine.playRestTone = origRest;
    audioEngine.speak = origSpeak;
  });

  test('Gestion de la Pause et Reprise synchronisée', () => {
    workoutEngine.startWorkout({ rounds: 1, workDuration: 10, restDuration: 5 });
    workoutEngine.advanceStep(); // WORK
    assert.equal(workoutEngine.state, 'WORK');

    workoutEngine.togglePause();
    assert.equal(workoutEngine.state, 'PAUSED');
    assert.equal(audioEngine.musicEngine.isPaused, true);

    workoutEngine.togglePause();
    assert.equal(workoutEngine.state, 'WORK');
    assert.equal(audioEngine.musicEngine.isPaused, false);

    workoutEngine.quitWorkout();
  });

  test('Support de la Musique Locale du Téléphone (LocalMusicManager & style local)', () => {
    assert.ok(audioEngine.localMusicManager, 'localMusicManager doit être instancié');
    assert.equal(audioEngine.localMusicManager.playlist.length, 0, 'La playlist locale démarre vide par défaut');
    assert.equal(audioEngine.localMusicManager.getCurrentTrack(), null);

    // Test acceptation du style 'local'
    audioEngine.musicEngine.setStyle('local');
    assert.equal(audioEngine.musicEngine.style, 'local');

    // Ducking et Unducking
    audioEngine.musicEngine.duck(0.2, 50);
    assert.equal(audioEngine.musicEngine.duckMultiplier, 0.2);

    audioEngine.musicEngine.unduck(50);
    assert.equal(audioEngine.musicEngine.duckMultiplier, 1.0);

    // Revenir à synthwave
    audioEngine.musicEngine.setStyle('synthwave');
    assert.equal(audioEngine.musicEngine.style, 'synthwave');
  });

  test('Baisse du volume sonore (ducking) garantie pendant le décompte 3s et les annonces vocales', () => {
    // Vérification initiale : volume normal 100%
    audioEngine.musicEngine.stopAllDucking();
    assert.equal(audioEngine.musicEngine.duckMultiplier, 1.0);

    // 1. Décompte 3s : le premier bip déclenche le ducking countdown à 20%
    audioEngine.musicEngine.duck(0.20, 80, 'countdown');
    assert.equal(audioEngine.musicEngine.duckMultiplier, 0.20, 'Le volume doit baisser à 20% dès le top 3s');

    // Le 2e et 3e bip maintiennent le ducking
    audioEngine.musicEngine.duck(0.20, 80, 'countdown');
    assert.equal(audioEngine.musicEngine.duckMultiplier, 0.20, 'Le volume reste à 20% pendant les bips suivants');

    // 2. Le coach vocal commence à parler pendant que le signal GO retentit
    audioEngine.musicEngine.duck(0.15, 80, 'voice');
    // Le volume baisse encore plus bas (15%) pour privilégier la voix
    assert.equal(audioEngine.musicEngine.duckMultiplier, 0.15, 'Le volume baisse à 15% pour la voix du coach');

    // 3. Le décompte et le bip se terminent
    audioEngine.musicEngine.unduck(60, 'countdown');
    // La voix est encore en cours : le volume NE DOIT PAS remonter
    assert.equal(audioEngine.musicEngine.duckMultiplier, 0.15, 'Le volume reste abaissé tant que la voix parle');

    // 4. La voix se termine
    audioEngine.musicEngine.unduck(400, 'voice');
    // Maintenant que toutes les raisons sont levées, le volume remonte à 100%
    assert.equal(audioEngine.musicEngine.duckMultiplier, 1.0, 'Le volume remonte à 100% une fois la voix terminée');
  });

  test('Configuration personnalisée de la voix du coach (genre et débit)', () => {
    assert.equal(typeof audioEngine.setVoiceConfig, 'function');
    audioEngine.setVoiceConfig({ gender: 'female', rate: 1.2 });
    assert.equal(audioEngine.voiceGender, 'female');
    assert.equal(audioEngine.voiceRate, 1.2);

    audioEngine.setVoiceConfig({ gender: 'male', rate: 0.9 });
    assert.equal(audioEngine.voiceGender, 'male');
    assert.equal(audioEngine.voiceRate, 0.9);

    audioEngine.setVoiceConfig({ gender: 'auto', rate: 1.05 });
    assert.equal(audioEngine.voiceGender, 'auto');
    assert.equal(audioEngine.voiceRate, 1.05);
  });

  test('Gestion des pistes musicales HUD (titre courant et saut de morceau)', () => {
    assert.equal(typeof audioEngine.musicEngine.getCurrentTrackTitle, 'function');
    assert.equal(typeof audioEngine.musicEngine.skipToNextTrack, 'function');

    audioEngine.musicEngine.setStyle('synthwave');
    const title1 = audioEngine.musicEngine.getCurrentTrackTitle();
    assert.ok(title1.includes('Synthwave'), 'Le titre synthwave doit mentionner le style');

    audioEngine.musicEngine.skipToNextTrack();
    const title2 = audioEngine.musicEngine.getCurrentTrackTitle();
    assert.ok(typeof title2 === 'string' && title2.length > 0);
  });

  test('Déclenchement des encouragements dynamiques en séance (mi-temps et 10s restantes)', () => {
    const spokenPhrases = [];
    const origSpeak = audioEngine.speak.bind(audioEngine);
    audioEngine.speak = (text) => spokenPhrases.push(text);

    // Initialiser workout avec 40s d'effort et encouragements activés
    env.get('window.appStorage').prefs.coachEncouragements = true;
    workoutEngine.startWorkout({ rounds: 1, workDuration: 40, restDuration: 10 });
    workoutEngine.advanceStep(); // WORK (duration = 40s)

    // Simuler le passage à 20s (mi-parcours 50%)
    workoutEngine.timeRemaining = 20;
    workoutEngine.processTimerTick(Date.now(), false);
    assert.ok(spokenPhrases.some(p => p.includes('mi-parcours')), "Une phrase d'encouragement doit être prononcée à 50% de l'effort");

    // Simuler le passage à 10s restantes
    workoutEngine.timeRemaining = 10;
    workoutEngine.processTimerTick(Date.now(), false);
    assert.ok(spokenPhrases.some(p => p.includes('10 secondes')), "Une annonce motivante doit être prononcée à 10s de la fin");

    workoutEngine.quitWorkout();
    audioEngine.speak = origSpeak;
  });
});

