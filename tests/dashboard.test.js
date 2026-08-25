import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Tableau de Bord & Métriques (dashboard.js & storage.js)', () => {
  let env;
  let AppStorage;
  let DashboardManager;
  let storage;
  let dashboard;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/storage.js');
    env.loadScript('js/dashboard.js');

    AppStorage = env.get('AppStorage');
    DashboardManager = env.get('DashboardManager');

    storage = new AppStorage();
    env.context.window.appStorage = storage;
    dashboard = new DashboardManager();
    env.context.window.dashboardManager = dashboard;
  });

  test('Agrégation des statistiques globales (minutes totales, séances)', () => {
    // 3 séances de 20 min (1200s), 15 min (900s), 10 min (600s)
    storage.addWorkoutSession({ durationSeconds: 1200, completed: true });
    storage.addWorkoutSession({ durationSeconds: 900, completed: true });
    storage.addWorkoutSession({ durationSeconds: 600, completed: true });
    // 1 séance abandonnée (completed: false)
    storage.addWorkoutSession({ durationSeconds: 300, completed: false });

    assert.equal(storage.getTotalWorkouts(), 3, 'Seules les séances complètes sont comptées');
    assert.equal(storage.getTotalTrainingMinutes(), 45, 'Le temps total doit être 20 + 15 + 10 = 45 min');
  });

  test('Dictionnaire des séances par date (getWorkoutsByDateMap)', () => {
    storage.addWorkoutSession({ date: '2026-08-01', completed: true });
    storage.addWorkoutSession({ date: '2026-08-01', completed: true });
    storage.addWorkoutSession({ date: '2026-08-02', completed: true });
    storage.addWorkoutSession({ date: '2026-08-03', completed: false });

    const map = storage.getWorkoutsByDateMap();
    assert.equal(map['2026-08-01'], 2);
    assert.equal(map['2026-08-02'], 1);
    assert.equal(map['2026-08-03'], undefined, 'Les séances abandonnées ne doivent pas figurer dans le calendrier');
  });

  test('Comptage des séances du mois en cours', () => {
    const now = new Date();
    const currentMonth = storage.formatDateISO(now);

    const pastMonth = new Date(now);
    pastMonth.setMonth(pastMonth.getMonth() - 2);
    const pastMonthDate = storage.formatDateISO(pastMonth);

    storage.addWorkoutSession({ date: currentMonth, completed: true });
    storage.addWorkoutSession({ date: pastMonthDate, completed: true });

    assert.equal(storage.getWorkoutsThisMonth(), 1);
  });
});
