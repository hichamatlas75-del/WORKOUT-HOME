import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Gestionnaire de Stockage Local (storage.js)', () => {
  let env;
  let AppStorage;
  let storage;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/storage.js');
    AppStorage = env.get('AppStorage');
    storage = new AppStorage();
    env.context.window.appStorage = storage;
  });

  test('Initialisation avec les préférences par défaut', () => {
    assert.equal(storage.prefs.rounds, 3);
    assert.equal(storage.prefs.workDuration, 40);
    assert.equal(storage.prefs.restDuration, 20);
    assert.equal(storage.prefs.plankDuration, 45);
    assert.equal(storage.prefs.targetTime, '17:00');
    assert.equal(storage.prefs.theme, 'dark');
    assert.equal(storage.prefs.userAvatar, '🦁');
  });

  test('Sauvegarde et persistance des préférences', () => {
    storage.savePreferences({ theme: 'light', rounds: 2, targetTime: '18:30', workDuration: 45, restDuration: 15 });
    assert.equal(storage.prefs.theme, 'light');
    assert.equal(storage.prefs.rounds, 2);
    assert.equal(storage.prefs.targetTime, '18:30');
    assert.equal(storage.prefs.workDuration, 45);
    assert.equal(storage.prefs.restDuration, 15);

    // Vérifier rechargement depuis localStorage
    const storage2 = new AppStorage();
    assert.equal(storage2.prefs.theme, 'light');
    assert.equal(storage2.prefs.rounds, 2);
    assert.equal(storage2.prefs.targetTime, '18:30');
    assert.equal(storage2.prefs.workDuration, 45);
    assert.equal(storage2.prefs.restDuration, 15);
  });

  test('Enregistrement d\'une séance d\'entraînement et estimation des calories', () => {
    const session = storage.addWorkoutSession({
      durationSeconds: 1200, // 20 minutes
      rounds: 2,
      completed: true,
      exercisesCount: 8
    });

    assert.ok(session.id.startsWith('ws_'));
    assert.equal(session.durationSeconds, 1200);
    assert.equal(session.rounds, 2);
    assert.equal(session.completed, true);
    // 20 min * 8.5 = 170 kcal
    assert.equal(session.caloriesEstimated, 170);

    assert.equal(storage.history.length, 1);
    assert.equal(storage.getTotalWorkouts(), 1);
    assert.equal(storage.getTotalTrainingMinutes(), 20);
  });

  test('Calcul de streak : 0 séance', () => {
    const streak = storage.getStreakStats();
    assert.equal(streak.currentStreak, 0);
    assert.equal(streak.bestStreak, 0);
    assert.equal(streak.doneToday, false);
  });

  test('Calcul de streak : séance effectuée aujourd\'hui', () => {
    const todayStr = storage.formatDateISO(new Date());
    storage.addWorkoutSession({ date: todayStr, completed: true, durationSeconds: 960 });

    const streak = storage.getStreakStats();
    assert.equal(streak.doneToday, true);
    assert.equal(streak.currentStreak, 1);
    assert.equal(streak.bestStreak, 1);
  });

  test('Calcul de streak : jours consécutifs (hier et aujourd\'hui)', () => {
    const now = new Date();
    const todayStr = storage.formatDateISO(now);
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = storage.formatDateISO(yesterday);

    storage.addWorkoutSession({ date: yesterdayStr, completed: true, durationSeconds: 960 });
    storage.addWorkoutSession({ date: todayStr, completed: true, durationSeconds: 960 });

    const streak = storage.getStreakStats();
    assert.equal(streak.doneToday, true);
    assert.equal(streak.currentStreak, 2);
    assert.equal(streak.bestStreak, 2);
  });

  test('Calcul de streak : séances multiples le même jour ne comptent que pour 1 jour de série', () => {
    const todayStr = storage.formatDateISO(new Date());
    storage.addWorkoutSession({ date: todayStr, completed: true, durationSeconds: 960 });
    storage.addWorkoutSession({ date: todayStr, completed: true, durationSeconds: 960 });

    const streak = storage.getStreakStats();
    assert.equal(streak.currentStreak, 1);
    assert.equal(storage.getTotalWorkouts(), 2);
  });

  test('Calcul de streak : série interrompue conserve le bestStreak historique', () => {
    const now = new Date();
    const dayAgo = (n) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return storage.formatDateISO(d);
    };

    // Série de 3 jours passés : J-10, J-9, J-8
    storage.addWorkoutSession({ date: dayAgo(10), completed: true, durationSeconds: 960 });
    storage.addWorkoutSession({ date: dayAgo(9), completed: true, durationSeconds: 960 });
    storage.addWorkoutSession({ date: dayAgo(8), completed: true, durationSeconds: 960 });

    // Aujourd'hui fait, mais J-1 à J-7 manqués
    storage.addWorkoutSession({ date: dayAgo(0), completed: true, durationSeconds: 960 });

    const streak = storage.getStreakStats();
    assert.equal(streak.currentStreak, 1);
    assert.equal(streak.bestStreak, 3);
  });

  test('Gestion des badges et déverrouillage unique', () => {
    assert.equal(storage.badges.length, 0);
    const unlocked1 = storage.unlockBadge('first_step');
    assert.equal(unlocked1, true);
    assert.equal(storage.badges.includes('first_step'), true);

    // Déverrouiller le même badge une seconde fois ne doit pas dupliquer
    const unlocked2 = storage.unlockBadge('first_step');
    assert.equal(unlocked2, false);
    assert.equal(storage.badges.length, 1);
  });

  test('Suivi du poids et calcul de l\'IMC', () => {
    storage.savePreferences({ heightCm: 180, initialWeight: 80, targetWeight: 75 });
    
    // IMC pour 80kg et 180cm -> 80 / (1.8^2) = 24.7
    const bmi = storage.calculateBMI(80);
    assert.equal(bmi.value, 24.7);
    assert.equal(bmi.category, 'Normal');

    // Ajout d'une pesée
    const entry = storage.addWeightEntry({ weight: '78.5', date: '2026-08-01', note: 'Forme olympique' });
    assert.ok(entry);
    assert.equal(entry.weight, 78.5);
    assert.equal(entry.note, 'Forme olympique');

    const stats = storage.getWeightStats();
    assert.equal(stats.hasData, true);
    assert.equal(stats.currentWeight, 78.5);
    assert.equal(stats.startWeight, 80);
    assert.equal(stats.delta, -1.5);
  });

  test('Protection contre le poids invalide', () => {
    const invalidEntry1 = storage.addWeightEntry({ weight: '10' }); // Trop bas (< 20)
    assert.equal(invalidEntry1, null);

    const invalidEntry2 = storage.addWeightEntry({ weight: '500' }); // Trop haut (> 300)
    assert.equal(invalidEntry2, null);

    const invalidEntry3 = storage.addWeightEntry({ weight: 'abc' });
    assert.equal(invalidEntry3, null);
  });

  test('Gestion Multi-Profils : création, basculement et isolation des données', () => {
    // 1. Profil par défaut
    assert.equal(storage.getProfiles().length, 1);
    assert.equal(storage.getActiveProfileId(), 'default');

    // Ajouter une séance sur le profil par défaut
    storage.addWorkoutSession({ durationSeconds: 600, rounds: 2, completed: true });
    assert.equal(storage.getTotalWorkouts(), 1);

    // 2. Créer un second profil
    const sarahProfile = storage.createProfile({
      name: 'Sarah',
      avatar: '🏋️‍♀️',
      level: 'beginner',
      initialWeight: 62
    });

    assert.ok(sarahProfile.id);
    assert.equal(sarahProfile.name, 'Sarah');
    assert.equal(sarahProfile.level, 'beginner');
    assert.equal(storage.getProfiles().length, 2);

    // 3. Basculer sur le profil de Sarah
    storage.switchProfile(sarahProfile.id);
    assert.equal(storage.getActiveProfileId(), sarahProfile.id);
    assert.equal(storage.prefs.userName, 'Sarah');
    assert.equal(storage.prefs.userLevel, 'beginner');
    assert.equal(storage.prefs.initialWeight, 62);

    // L'historique de Sarah doit être vierge (isolation)
    assert.equal(storage.getTotalWorkouts(), 0);
    assert.equal(storage.history.length, 0);

    // Enregistrer une séance pour Sarah
    storage.addWorkoutSession({ durationSeconds: 900, rounds: 2, completed: true, level: 'beginner' });
    assert.equal(storage.getTotalWorkouts(), 1);

    // 4. Rebasculer sur le profil par défaut
    storage.switchProfile('default');
    assert.equal(storage.getActiveProfileId(), 'default');
    assert.equal(storage.getTotalWorkouts(), 1); // Sa séance originale
    assert.equal(storage.history[0].durationSeconds, 600);

    // 5. Suppression de profil
    const deleted = storage.deleteProfile(sarahProfile.id);
    assert.equal(deleted, true);
    assert.equal(storage.getProfiles().length, 1);
  });
});
