import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTestEnvironment } from './helpers/setup.js';

describe('Base de données des Exercices & Niveaux (exercises.js)', () => {
  const env = createTestEnvironment();
  env.loadScript('js/exercises.js');
  const EXERCISES_DATA = env.get('EXERCISES_DATA');
  const PROGRAM_WEEKS = env.get('PROGRAM_WEEKS');
  const ROUTINES_BY_LEVEL = env.get('ROUTINES_BY_LEVEL');
  const getExercisesForLevel = env.get('getExercisesForLevel');
  const getActiveWorkoutExercises = env.get('getActiveWorkoutExercises');
  const getExerciseById = env.get('getExerciseById');

  test('La base contient 20 exercices avec des IDs uniques', () => {
    assert.equal(Array.isArray(EXERCISES_DATA), true);
    assert.equal(EXERCISES_DATA.length, 20);

    const ids = Array.from(EXERCISES_DATA).map(ex => ex.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 20, 'Les IDs doivent être tous uniques');
  });

  test('Chaque exercice possède tous les champs requis, valides et typés', () => {
    for (const ex of EXERCISES_DATA) {
      assert.ok(ex.name && ex.name.trim().length > 0, `L'exercice ${ex.id} doit avoir un nom`);
      assert.ok(ex.number, `L'exercice ${ex.id} doit avoir un numéro formaté`);
      assert.ok(typeof ex.duration === 'number' && ex.duration >= 20, `L'exercice ${ex.id} doit avoir une durée >= 20s`);
      assert.ok(['beginner', 'intermediate', 'advanced'].includes(ex.level), `L'exercice ${ex.id} doit avoir un niveau valide`);
      assert.ok(ex.targetMuscles, `L'exercice ${ex.id} doit spécifier les muscles ciblés`);
      assert.ok(ex.targetPrimary, `L'exercice ${ex.id} doit spécifier la cible principale`);
      assert.ok(ex.cue, `L'exercice ${ex.id} doit inclure un conseil technique (cue)`);
      assert.ok(ex.breathing, `L'exercice ${ex.id} doit inclure un conseil de respiration`);
      assert.ok(ex.description, `L'exercice ${ex.id} doit inclure une description`);
      assert.ok(ex.adaptation, `L'exercice ${ex.id} doit inclure une adaptation débutant/avancé`);
      assert.ok(ex.image && ex.image.endsWith('.jpg'), `L'exercice ${ex.id} doit avoir une image poster JPG valide`);
      assert.ok(ex.video && ex.video.endsWith('.mp4'), `L'exercice ${ex.id} doit avoir une vidéo MP4 valide`);
    }
  });

  test('Vérification des nouveaux exercices ajoutés (Pompes genoux, Diamant, Burpees, Fentes...)', () => {
    const lunges = getExerciseById(10);
    assert.ok(lunges, 'Fentes alternées doit exister');
    assert.equal(lunges.name, 'FENTES ALTERNÉES');

    const kneePush = getExerciseById(11);
    assert.ok(kneePush, 'Pompes genoux doit exister');
    assert.equal(kneePush.level, 'beginner');

    const diamond = getExerciseById(12);
    assert.ok(diamond, 'Pompes diamant doit exister');
    assert.equal(diamond.level, 'advanced');

    const burpees = getExerciseById(13);
    assert.ok(burpees, 'Burpees doit exister');
    assert.equal(burpees.level, 'advanced');

    const superman = getExerciseById(19);
    assert.ok(superman, 'Superman doit exister');
    assert.equal(superman.level, 'beginner');

    const wallSit = getExerciseById(20);
    assert.ok(wallSit, 'Chaise au mur doit exister');
    assert.equal(wallSit.level, 'beginner');
  });

  test('Les images des 20 exercices existent sur le disque et les chemins vidéo sont valides', () => {
    const projectRoot = path.resolve('.');
    for (const ex of EXERCISES_DATA) {
      const imgPath = path.join(projectRoot, ex.image);
      assert.ok(fs.existsSync(imgPath), `L'image ${ex.image} doit exister sur le disque`);
      assert.ok(ex.video && ex.video.endsWith('.mp4'), `La vidéo ${ex.video} doit être au format .mp4`);
    }
  });

  test('Routines adaptées par niveau (Débutant, Intermédiaire, Avancé)', () => {
    const begExercises = getExercisesForLevel('beginner');
    assert.ok(begExercises.length >= 7, 'Routine débutant doit comporter au moins 7 exercices');
    assert.ok(begExercises.some(e => e.id === 8), 'Doit inclure la planche');
    assert.ok(begExercises.some(e => e.id === 9), 'Doit inclure les étirements');

    const intExercises = getExercisesForLevel('intermediate');
    assert.ok(intExercises.length >= 8, 'Routine intermédiaire doit comporter au moins 8 exercices');

    const advExercises = getExercisesForLevel('advanced');
    assert.ok(advExercises.length >= 8, 'Routine avancée doit comporter au moins 8 exercices');
    assert.ok(advExercises.some(e => e.id === 13), 'Doit inclure les Burpees');
  });

  test('Génération de routine personnalisée et respect de l ordre (Custom Routine & Ordering)', () => {
    const customPrefs = {
      userLevel: 'custom',
      customExerciseIds: [14, 10, 2, 1, 8] // ordre personnalisé
    };
    const customList = getActiveWorkoutExercises(customPrefs);
    assert.equal(customList.length, 6, 'Doit comporter les 5 exercices choisis + étirements');
    assert.equal(customList[0].id, 14, 'Le premier exercice doit être Russian Twists (14)');
    assert.equal(customList[1].id, 10, 'Le deuxième exercice doit être Fentes (10)');
    assert.equal(customList[2].id, 2, 'Le troisième exercice doit être Squats (2)');
    assert.equal(customList[3].id, 1, 'Le quatrième exercice doit être Jumping Jack (1)');
    assert.equal(customList[4].id, 8, 'Le cinquième exercice doit être Planche (8)');
    assert.equal(customList[5].id, 9, 'Le dernier exercice doit être Étirements (9)');
  });

  test('Le programme sur 8 semaines est valide et cohérent', () => {
    assert.equal(Array.isArray(PROGRAM_WEEKS), true);
    assert.equal(PROGRAM_WEEKS.length, 4, 'Le programme comporte 4 paliers');

    for (const block of PROGRAM_WEEKS) {
      assert.ok(block.weeks, 'Le palier doit indiquer la période de semaines');
      assert.ok(typeof block.rounds === 'number' && block.rounds >= 2 && block.rounds <= 3, 'Les tours doivent être 2 ou 3');
      assert.ok(block.title, 'Le palier doit avoir un titre');
      assert.ok(block.desc, 'Le palier doit avoir une description');
    }
  });
});

