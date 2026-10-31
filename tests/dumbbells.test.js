import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Entraînement 2 Haltères — Full Body & Core (dumbbells.js)', () => {
  let env;
  let DUMBBELL_WORKOUT_DATA;
  let DumbbellsManager;
  let manager;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/dumbbells.js');

    DUMBBELL_WORKOUT_DATA = env.get('DUMBBELL_WORKOUT_DATA');
    manager = env.get('window.dumbbellsManager');
  });

  test('La structure de la séance contient tous les métadonnées requises', () => {
    assert.equal(DUMBBELL_WORKOUT_DATA.id, 'workout_dumbbells_fullbody_core');
    assert.equal(DUMBBELL_WORKOUT_DATA.title, 'Full Body & Core avec 2 Haltères');
    assert.ok(DUMBBELL_WORKOUT_DATA.subtitle);
    assert.ok(DUMBBELL_WORKOUT_DATA.estimatedDuration.includes('35-45'));
    assert.equal(Array.isArray(DUMBBELL_WORKOUT_DATA.equipmentList), true);
    assert.ok(DUMBBELL_WORKOUT_DATA.equipmentList.length >= 4);
    assert.equal(DUMBBELL_WORKOUT_DATA.blocks.length, 6);
  });

  test('Vérification des 5 Blocs Supersets/Combos + 1 Circuit Abdos', () => {
    const blocks = DUMBBELL_WORKOUT_DATA.blocks;

    // Bloc 1 : Pectoraux & Dos (Superset)
    assert.equal(blocks[0].name.includes('Pectoraux & Dos'), true);
    assert.equal(blocks[0].type, 'superset');
    assert.equal(blocks[0].exercises.length, 2);
    assert.equal(blocks[0].exercises[0].name.includes('Développé Couché'), true);
    assert.equal(blocks[0].exercises[1].name.includes('Rowing'), true);
    assert.equal(blocks[0].restSeconds, 60);

    // Bloc 2 : Triceps (Superset)
    assert.equal(blocks[1].name.includes('Triceps'), true);
    assert.equal(blocks[1].type, 'superset');
    assert.equal(blocks[1].exercises.length, 2);
    assert.equal(blocks[1].exercises[0].name.includes('Relevé Triceps'), true);
    assert.equal(blocks[1].exercises[1].name.includes('Pompes Diamant'), true);
    assert.equal(blocks[1].restSeconds, 60);

    // Bloc 3 : Épaules (Série Combinée)
    assert.equal(blocks[2].name.includes('Épaules'), true);
    assert.equal(blocks[2].exercises.length, 1);
    assert.equal(blocks[2].exercises[0].name.includes('Relevés Latéraux & Frontaux'), true);

    // Bloc 4 : Jambes (Superset)
    assert.equal(blocks[3].name.includes('Jambes'), true);
    assert.equal(blocks[3].type, 'superset');
    assert.equal(blocks[3].exercises.length, 2);
    assert.equal(blocks[3].exercises[0].name.includes('Fentes Surélevées'), true);
    assert.equal(blocks[3].exercises[1].name.includes('Squats'), true);

    // Bloc 5 : Biceps (Isolation Supination)
    assert.equal(blocks[4].name.includes('Biceps'), true);
    assert.equal(blocks[4].exercises.length, 1);
    assert.equal(blocks[4].exercises[0].name.includes('Curl Biceps en Rotation'), true);

    // Bloc 6 & 7 : Finition Sangle Abdominale (Circuit Abdos)
    assert.equal(blocks[5].name.includes('Sangle Abdominale'), true);
    assert.equal(blocks[5].type, 'circuit');
    assert.equal(blocks[5].exercises.length, 2);
    assert.equal(blocks[5].exercises[0].name.includes('Russian Twist'), true);
    assert.equal(blocks[5].exercises[1].name.includes('Planche Classique'), true);
    assert.equal(blocks[5].restSeconds, 45);
  });

  test('Chaque exercice possède tous les champs obligatoires demandés par l\'utilisateur', () => {
    let totalExercises = 0;
    DUMBBELL_WORKOUT_DATA.blocks.forEach(block => {
      block.exercises.forEach(ex => {
        totalExercises++;
        // 1. Nom & Icône
        assert.ok(ex.name, 'Nom obligatoire');
        assert.ok(ex.icon, 'Icône obligatoire');
        // 2. Groupe musculaire ciblé (Badge couleur)
        assert.ok(ex.categoryTag, 'Groupe musculaire obligatoire');
        assert.ok(ex.badgeClass, 'Classe de badge couleur obligatoire');
        // 3. Équipement nécessaire
        assert.ok(ex.equipment, 'Équipement obligatoire');
        // 4. Consignes d\'exécution courtes et claires
        assert.ok(ex.instructions && ex.instructions.length > 20, 'Consignes requises');
        assert.ok(Array.isArray(ex.formCues) && ex.formCues.length >= 2, 'Clés de forme requises');
        assert.ok(ex.breathing, 'Consigne de respiration requise');
        // 5. Paramètres recommandés (Séries, Répétitions / Temps, Repos)
        assert.ok(ex.series, 'Séries recommandées requises');
        assert.ok(ex.reps, 'Répétitions/temps requis');
        assert.ok(ex.rest, 'Repos requis');
      });
    });

    assert.equal(totalExercises, 10, '10 mouvements au total (7 exercices décomposés avec supersets)');
  });

  test('Gestionnaire interactif : validation de séries et calcul de progression', () => {
    assert.ok(manager);
    assert.equal(manager.targetRounds, 3);

    // Cocher la série 1 du Développé Couché
    manager.toggleSet('db_1a', 1);
    assert.equal(manager.completedSets['db_1a_s1'], true);

    // Vérifier la persistance dans localStorage
    const saved = JSON.parse(env.localStorage.getItem('fb17_dumbbells_completed_sets'));
    assert.equal(saved['db_1a_s1'], true);

    // Décocher
    manager.toggleSet('db_1a', 1);
    assert.equal(manager.completedSets['db_1a_s1'], false);

    // Basculer en mode 4 séries
    manager.setTargetRounds(4);
    assert.equal(manager.targetRounds, 4);

    // Réinitialisation complète
    manager.toggleSet('db_1a', 1);
    manager.toggleSet('db_1b', 1);
    manager.resetAllSets();
    assert.equal(Object.keys(manager.completedSets).length, 0);
  });

  test('Chronomètre de repos et formattage des secondes', () => {
    assert.equal(manager.formatRestSeconds(45), '45s');
    assert.equal(manager.formatRestSeconds(60), '1:00s');
    assert.equal(manager.formatRestSeconds(75), '1:15s');
    assert.equal(manager.formatRestSeconds(90), '1:30s');
  });

  test('Génération HTML du bloc et des cartes d\'exercices sans erreur', () => {
    const block1 = DUMBBELL_WORKOUT_DATA.blocks[0];
    const blockHtml = manager.renderBlockHtml(block1);

    assert.ok(blockHtml.includes('BLOC 1 : Pectoraux & Dos'));
    assert.ok(blockHtml.includes('SUPERSET ANTAGONISTE'));
    assert.ok(blockHtml.includes('Développé Couché Alterné'));
    assert.ok(blockHtml.includes('Rowing Buste Penché'));
    assert.ok(blockHtml.includes('60s de repos'));
    assert.ok(blockHtml.includes('db-preview-video-btn'), 'Doit inclure le bouton de démo vidéo');
  });

  test('La vue générale comprend le bouton de lancement live interactif', () => {
    // Simuler le conteneur dans l'environnement de test
    const fakeContainer = { innerHTML: '' };
    env.context.document.getElementById = (id) => (id === 'view-dumbbells' ? fakeContainer : null);

    manager.renderView();
    assert.ok(fakeContainer.innerHTML.includes('db-live-start-btn'), 'Doit inclure le bouton de lancement interactif');
    assert.ok(fakeContainer.innerHTML.includes('startWorkoutSession'), 'Doit appeler startWorkoutSession');
    assert.ok(fakeContainer.innerHTML.includes('dumbbells'), 'Doit spécifier le mode dumbbells');
  });

  test('Réglage et persistance de la charge par exercice (adjustWeight)', () => {
    assert.equal(manager.getExerciseWeight('db_1a'), 10);
    manager.adjustWeight('db_1a', 2);
    assert.equal(manager.getExerciseWeight('db_1a'), 12);
    manager.adjustWeight('db_1a', -1);
    assert.equal(manager.getExerciseWeight('db_1a'), 11);

    const savedWeights = JSON.parse(env.localStorage.getItem('fb17_dumbbells_weights'));
    assert.equal(savedWeights['db_1a'], 11);
  });
});
