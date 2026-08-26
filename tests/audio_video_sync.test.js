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
});
