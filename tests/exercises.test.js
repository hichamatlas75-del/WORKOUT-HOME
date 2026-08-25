import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createTestEnvironment } from './helpers/setup.js';

describe('Base de données des Exercices (exercises.js)', () => {
  const env = createTestEnvironment();
  env.loadScript('js/exercises.js');
  const EXERCISES_DATA = env.get('EXERCISES_DATA');
  const PROGRAM_WEEKS = env.get('PROGRAM_WEEKS');

  test('La base contient exactement 9 exercices avec des IDs uniques', () => {
    assert.equal(Array.isArray(EXERCISES_DATA), true);
    assert.equal(EXERCISES_DATA.length, 9);

    const ids = Array.from(EXERCISES_DATA).map(ex => ex.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 9, 'Les IDs doivent être tous uniques');
    assert.deepEqual(ids, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test('Chaque exercice possède tous les champs requis et valides', () => {
    for (const ex of EXERCISES_DATA) {
      assert.ok(ex.name && ex.name.trim().length > 0, `L'exercice ${ex.id} doit avoir un nom`);
      assert.ok(ex.number, `L'exercice ${ex.id} doit avoir un numéro formaté`);
      assert.ok(typeof ex.duration === 'number' && ex.duration >= 20, `L'exercice ${ex.id} doit avoir une durée >= 20s`);
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

  test('Vérification de l\'exercice Mountain Climbers (ID 5)', () => {
    const climbers = EXERCISES_DATA.find(e => e.id === 5);
    assert.ok(climbers, 'Mountain Climbers doit être présent');
    assert.equal(climbers.name, 'MOUNTAIN CLIMBERS');
    assert.equal(climbers.number, '05');
    assert.equal(climbers.targetPrimary, 'CARDIO & ABDOMINAUX');
  });

  test('Les fichiers d\'images et vidéos référencés existent sur le disque', () => {
    const projectRoot = path.resolve('.');
    for (const ex of EXERCISES_DATA) {
      const imgPath = path.join(projectRoot, ex.image);
      const vidPath = path.join(projectRoot, ex.video);
      assert.ok(fs.existsSync(imgPath), `L'image ${ex.image} doit exister`);
      assert.ok(fs.existsSync(vidPath), `La vidéo ${ex.video} doit exister`);
    }
  });

  test('Vérification des propriétés spécifiques (Planche & Retour au calme)', () => {
    const plank = EXERCISES_DATA.find(e => e.id === 8);
    assert.ok(plank, 'L\'exercice 8 (Planche) doit exister');
    assert.equal(plank.isPlank, true, 'L\'exercice 8 doit être marqué isPlank');

    const coolDown = EXERCISES_DATA.find(e => e.id === 9);
    assert.ok(coolDown, 'L\'exercice 9 (Étirements) doit exister');
    assert.equal(coolDown.isCoolDown, true, 'L\'exercice 9 doit être marqué isCoolDown');
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
