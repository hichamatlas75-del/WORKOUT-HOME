import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createTestEnvironment } from './helpers/setup.js';

describe('Synchronisation Cloud et Passerelle API (sync.js & gateway)', () => {
  let env;
  let AppStorage;
  let ProfileSyncManager;
  let storage;
  let sync;

  beforeEach(() => {
    env = createTestEnvironment();
    env.loadScript('js/storage.js');
    env.loadScript('js/sync.js');

    AppStorage = env.get('AppStorage');
    ProfileSyncManager = env.get('ProfileSyncManager');

    storage = new AppStorage();
    env.context.window.appStorage = storage;
    sync = new ProfileSyncManager();
    env.context.window.syncManager = sync;
  });

  test('Nettoyage et normalisation de l\'identifiant utilisateur (userId)', () => {
    storage.savePreferences({
      syncUserId: '  User@Name#17!  ',
      syncUserPin: '1234'
    });

    const config = sync.getConfig();
    assert.equal(config.userId, 'user_name_17_');
    assert.equal(config.password, '1234');
  });

  test('Génération de hash utilisateur sécurisé', async () => {
    const hash1 = await sync.hashUserId('athlete_1');
    const hash2 = await sync.hashUserId('athlete_1');
    const hash3 = await sync.hashUserId('athlete_2');

    assert.ok(hash1.startsWith('u_'));
    assert.equal(hash1, hash2, 'Le même userId doit produire le même hash');
    assert.notEqual(hash1, hash3, 'Des userIds distincts doivent produire des hashes distincts');
  });

  test('Validation de la règle de sécurité serveur Firebase (Regex anti injection)', () => {
    const sanitizeUser = (user) => user.replace(/[^a-z0-9_-]/gi, '_');

    assert.equal(sanitizeUser('user.json?auth=admin'), 'user_json_auth_admin');
    assert.equal(sanitizeUser('../../admin'), '______admin');
    assert.equal(sanitizeUser('normal-user_99'), 'normal-user_99');
  });

  test('Chiffrement et déchiffrement Zero-Knowledge du paquet complet incluant les pas (stepsHistory)', async () => {
    storage.addSteps(6500, '2026-10-27', true);

    const fullLocalData = {
      app: 'FULL_BODY_17',
      version: '2.5.0',
      syncedAt: Date.now(),
      prefs: storage.prefs,
      history: storage.history,
      badges: storage.badges,
      weightHistory: storage.weightHistory,
      stepsHistory: storage.stepsHistory
    };

    const envelope = await sync.encryptPayload(fullLocalData, 'user_test', 'mon_secret_123');
    assert.ok(envelope.payload || envelope.raw, 'Le paquet doit être chiffré');

    const decrypted = await sync.decryptPayload(envelope, 'user_test', 'mon_secret_123');
    assert.ok(decrypted.stepsHistory, 'Le paquet déchiffré doit contenir stepsHistory');
    assert.equal(decrypted.stepsHistory['2026-10-27'].steps, 6500);
  });
});
