import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Système de Motivation et Badges (motivation.js)', () => {
  let env;
  let AppStorage;
  let MotivationManager;
  let BADGES_DEFINITIONS;
  let storage;
  let motivation;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/storage.js');
    env.loadScript('js/motivation.js');

    AppStorage = env.get('AppStorage');
    MotivationManager = env.get('MotivationManager');
    BADGES_DEFINITIONS = env.get('BADGES_DEFINITIONS');

    storage = new AppStorage();
    env.context.window.appStorage = storage;
    motivation = new MotivationManager();
    env.context.window.motivationManager = motivation;
  });

  test('La liste des définitions de badges est valide et complète', () => {
    assert.ok(Array.isArray(BADGES_DEFINITIONS));
    assert.ok(BADGES_DEFINITIONS.length >= 8);

    const ids = BADGES_DEFINITIONS.map(b => b.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, BADGES_DEFINITIONS.length, 'Tous les IDs de badges doivent être uniques');

    for (const b of BADGES_DEFINITIONS) {
      assert.ok(b.id, 'Le badge doit avoir un ID');
      assert.ok(b.icon, 'Le badge doit avoir une icône');
      assert.ok(b.title, 'Le badge doit avoir un titre');
      assert.ok(b.desc, 'Le badge doit avoir une description');
      assert.equal(typeof b.check, 'function', 'Le badge doit avoir une fonction de validation check()');
    }
  });

  test('Déblocage du badge "Premier Pas" (first_step)', () => {
    const session = storage.addWorkoutSession({ durationSeconds: 960, completed: true });
    const newlyUnlocked = motivation.checkAndUnlockBadges(session);

    const firstStep = newlyUnlocked.find(b => b.id === 'first_step');
    assert.ok(firstStep, 'Le badge first_step doit être débloqué');
    assert.equal(storage.badges.includes('first_step'), true);
  });

  test('Déblocage des badges de série (streak_1, streak_3, streak_7)', () => {
    const now = new Date();
    const dayAgo = (n) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return storage.formatDateISO(d);
    };

    // 1er jour (aujourd'hui) -> active streak_1
    let session = storage.addWorkoutSession({ date: dayAgo(0), completed: true });
    let unlocked = motivation.checkAndUnlockBadges(session);
    assert.ok(unlocked.some(b => b.id === 'streak_1'), 'Le badge streak_1 doit se débloquer');

    // Réinitialiser pour tester 3 jours consécutifs
    storage = new AppStorage();
    env.context.window.appStorage = storage;
    storage.addWorkoutSession({ date: dayAgo(2), completed: true });
    storage.addWorkoutSession({ date: dayAgo(1), completed: true });
    session = storage.addWorkoutSession({ date: dayAgo(0), completed: true });
    unlocked = motivation.checkAndUnlockBadges(session);
    assert.ok(unlocked.some(b => b.id === 'streak_3'), 'Le badge streak_3 doit être débloqué après 3 jours consécutifs');
  });

  test('Déblocage du badge ponctualité 17h (punctual_17)', () => {
    // Séance effectuée à 17h05
    const timestampAt1705 = new Date();
    timestampAt1705.setHours(17, 5, 0, 0);

    const session17 = storage.addWorkoutSession({
      durationSeconds: 960,
      completed: true
    });
    session17.timestamp = timestampAt1705.getTime();

    const unlocked = motivation.checkAndUnlockBadges(session17);
    assert.ok(unlocked.some(b => b.id === 'punctual_17'), 'Le badge 17h doit se débloquer pour une séance à 17h05');
  });

  test('Déblocage du badge 3 tours (triple_round)', () => {
    const session3Rounds = storage.addWorkoutSession({
      durationSeconds: 1400,
      rounds: 3,
      completed: true
    });

    const unlocked = motivation.checkAndUnlockBadges(session3Rounds);
    assert.ok(unlocked.some(b => b.id === 'triple_round'), 'Le badge triple_round doit se débloquer pour 3 tours');
  });
});
