import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Podomètre & Compteur de Calories Combinées (pedometer.js & storage.js)', () => {
  let env;
  let AppStorage;
  let PedometerManager;
  let storage;
  let pedometer;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/storage.js');
    env.loadScript('js/pedometer.js');

    AppStorage = env.get('AppStorage');
    PedometerManager = env.get('PedometerManager');

    storage = new AppStorage();
    env.context.window.appStorage = storage;

    pedometer = new PedometerManager();
    env.context.window.pedometerManager = pedometer;
  });

  test('Préférences d\'activité par défaut (objectifs de pas et calories)', () => {
    assert.equal(storage.prefs.dailyStepGoal, 8000, 'Objectif de pas par défaut : 8000');
    assert.equal(storage.prefs.dailyCalorieGoal, 500, 'Objectif calorique par défaut : 500 kcal');
    assert.equal(storage.prefs.strideLengthCm, 74, 'Foulée par défaut : 74 cm');
  });

  test('Calcul de la longueur de foulée (calculateStrideLengthM)', () => {
    // Par défaut
    assert.equal(storage.calculateStrideLengthM(), 0.74);

    // Basé sur la taille de l'utilisateur (180 cm -> 180 * 0.414 / 100 = 0.7452)
    const stride180 = storage.calculateStrideLengthM(180);
    assert.ok(Math.abs(stride180 - 0.7452) < 0.001);

    // Basé sur les préférences
    storage.savePreferences({ strideLengthCm: 80 });
    assert.equal(storage.calculateStrideLengthM(), 0.80);
  });

  test('Calcul de la distance parcourue en kilomètres (calculateDistanceKm)', () => {
    // 10 000 pas avec foulée par défaut (0.74m) = 7.4 km
    const dist10k = storage.calculateDistanceKm(10000);
    assert.equal(dist10k, 7.4);

    // 5 000 pas = 3.7 km
    const dist5k = storage.calculateDistanceKm(5000);
    assert.equal(dist5k, 3.7);

    // 0 pas = 0 km
    assert.equal(storage.calculateDistanceKm(0), 0);
  });

  test('Calcul des calories de marche selon le poids corporel (calculateWalkingCalories)', () => {
    // 10 000 pas (~7.4 km) pour un utilisateur de 70 kg : 7.4 * 70 * 0.75 = 388.5 -> 389 kcal
    const cal70kg = storage.calculateWalkingCalories(10000, 70);
    assert.equal(cal70kg, 389);

    // Pour un utilisateur plus lourd (90 kg) : 7.4 * 90 * 0.75 = 499.5 -> 500 kcal
    const cal90kg = storage.calculateWalkingCalories(10000, 90);
    assert.equal(cal90kg, 500);

    // Si le poids n'est pas fourni, utilise le poids actuel dans l'historique ou prefs
    storage.addWeightEntry({ weight: 75, date: '2026-10-27' });
    const calAutoWeight = storage.calculateWalkingCalories(10000);
    // 7.4 * 75 * 0.75 = 416.25 -> 416 kcal
    assert.equal(calAutoWeight, 416);
  });

  test('Enregistrement et accumulation des pas quotidiens (addSteps & saveDailySteps)', () => {
    const today = storage.formatDateISO(new Date());

    assert.equal(storage.getDailySteps(today), 0, 'Initialement 0 pas');

    // Ajout manuel de 1 000 pas
    const entry1 = storage.addSteps(1000, today, true);
    assert.equal(entry1.steps, 1000);
    assert.equal(entry1.manual, 1000);
    assert.equal(entry1.distanceKm, 0.74);
    assert.ok(entry1.calories > 0);

    // Ajout supplémentaire de 2 500 pas
    const entry2 = storage.addSteps(2500, today, true);
    assert.equal(entry2.steps, 3500);
    assert.equal(entry2.manual, 3500);
    assert.equal(entry2.distanceKm, 2.59);

    // Vérifier getDailySteps
    assert.equal(storage.getDailySteps(today), 3500);
  });

  test('Réinitialisation des pas quotidiens (resetDailySteps)', () => {
    const today = storage.formatDateISO(new Date());
    storage.addSteps(5000, today, true);
    assert.equal(storage.getDailySteps(today), 5000);

    storage.resetDailySteps(today);
    assert.equal(storage.getDailySteps(today), 0);
  });

  test('Calcul unifié des calories combinées : Workout HIIT + Marche (getDailyActivitySummary)', () => {
    const today = storage.formatDateISO(new Date());

    // 1. Séance d'entraînement de 20 minutes (1200s) : 20 * 8.5 = 170 kcal
    storage.addWorkoutSession({
      date: today,
      durationSeconds: 1200,
      completed: true,
      rounds: 3
    });

    // 2. 5 000 pas de marche (pour 70 kg : ~3.7 km * 70 * 0.75 = 194 kcal)
    storage.addSteps(5000, today, true);

    const summary = storage.getDailyActivitySummary(today);

    assert.equal(summary.date, today);
    assert.equal(summary.workoutCount, 1);
    assert.equal(summary.workoutMinutes, 20);
    assert.equal(summary.workoutCalories, 170);

    assert.equal(summary.steps, 5000);
    assert.equal(summary.distanceKm, 3.7);
    assert.equal(summary.stepCalories, 194);

    // Total combiné = 170 + 194 = 364 kcal
    assert.equal(summary.totalCalories, 364);

    // Objectif par défaut 500 kcal -> (364 / 500) * 100 = 73%
    assert.equal(summary.caloriePercent, 73);
    // Objectif pas par défaut 8000 -> (5000 / 8000) * 100 = 63%
    assert.equal(summary.stepPercent, 63);
  });

  test('Historique hebdomadaire sur 7 jours (getWeeklyActivitySummary)', () => {
    const weekly = storage.getWeeklyActivitySummary(7);
    assert.equal(weekly.length, 7, 'Doit retourner exactement 7 jours');

    const today = storage.formatDateISO(new Date());
    assert.equal(weekly[6].date, today, 'Le dernier jour doit être aujourd\'hui');
  });

  test('Isolation des pas entre profils utilisateurs différents (Multi-Profils)', () => {
    const today = storage.formatDateISO(new Date());

    // Profil 1 ajoute 4 000 pas
    storage.addSteps(4000, today, true);
    assert.equal(storage.getDailySteps(today), 4000);

    // Créer et basculer sur Profil 2
    const prof2 = storage.createProfile({ name: 'Utilisateur 2' });
    storage.switchProfile(prof2.id);

    // Profil 2 doit avoir 0 pas
    assert.equal(storage.getDailySteps(today), 0, 'Profil 2 doit avoir un compteur vierge');

    // Profil 2 ajoute 7 500 pas
    storage.addSteps(7500, today, true);
    assert.equal(storage.getDailySteps(today), 7500);

    // Revenir sur le premier profil
    storage.switchProfile('default');
    assert.equal(storage.getDailySteps(today), 4000, 'Profil 1 conserve ses 4 000 pas intacts');
  });

  test('Exportation, importation et fusion des pas (backup & sync)', () => {
    const today = storage.formatDateISO(new Date());
    storage.addSteps(6200, today, true);

    // Export JSON
    const exported = storage.exportJSON();
    assert.ok(exported.includes('stepsHistory'), 'L\'export doit contenir stepsHistory');

    // Nouvelle instance vierge
    const storage2 = new AppStorage();
    storage2.clearAllData();
    assert.equal(storage2.getDailySteps(today), 0);

    // Import
    const success = storage2.importJSON(exported);
    assert.equal(success, true);
    assert.equal(storage2.getDailySteps(today), 6200);

    // Fusion de données (mergeData) : conserve le plus grand nombre de pas
    storage2.mergeData({
      stepsHistory: {
        [today]: { steps: 8500, distanceKm: 6.29, calories: 330 }
      }
    });
    assert.equal(storage2.getDailySteps(today), 8500, 'La fusion prend en compte le pas le plus élevé');
  });

  test('PedometerManager : cycles start, pause, stop et détection de mouvements', async () => {
    assert.equal(pedometer.isTracking, false);
    assert.equal(pedometer.isPaused, false);

    // Démarrer la session
    await pedometer.startTracking();
    assert.equal(pedometer.isTracking, true);
    assert.equal(pedometer.isPaused, false);

    // Simuler un mouvement d'accélération au-dessus du seuil (1.35 m/s²)
    const motionEvent = {
      acceleration: { x: 0.5, y: 1.8, z: 0.6 } // mag = sqrt(0.25 + 3.24 + 0.36) = 1.96 m/s²
    };
    pedometer.handleDeviceMotion(motionEvent);
    assert.equal(pedometer.sessionSteps, 1, 'Un pas doit être détecté');

    // Mettre en pause
    pedometer.pauseTracking();
    assert.equal(pedometer.isPaused, true);

    // Aucun pas détecté en pause
    pedometer.handleDeviceMotion(motionEvent);
    assert.equal(pedometer.sessionSteps, 1);

    // Reprise
    await pedometer.resumeTracking();
    assert.equal(pedometer.isPaused, false);

    // Arrêt de la session
    pedometer.stopTracking();
    assert.equal(pedometer.isTracking, false);
  });
});
