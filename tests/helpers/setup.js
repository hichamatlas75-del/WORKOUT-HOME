import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

export class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

export function createTestEnvironment() {
  const localStorage = new MockLocalStorage();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Set,
    Map,
    Promise,
    RegExp,
    parseFloat,
    parseInt,
    isNaN,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    crypto: globalThis.crypto,
    localStorage,
    window: {},
    document: {
      getElementById: () => null,
      createElement: () => ({ classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }),
      querySelectorAll: () => [],
      documentElement: {
        getAttribute: () => 'dark',
        setAttribute: () => {},
        dataset: {}
      }
    }
  };

  context.window.localStorage = localStorage;
  context.window.document = context.document;
  context.window.crypto = globalThis.crypto;
  context.globalThis = context;
  context.window.window = context.window;

  vm.createContext(context);

  function loadScript(relativePath) {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const code = fs.readFileSync(fullPath, 'utf8');
    vm.runInContext(code, context, { filename: relativePath });
  }

  function evalInContext(code) {
    return vm.runInContext(code, context);
  }

  return {
    context,
    localStorage,
    loadScript,
    eval: evalInContext,
    get: (key) => vm.runInContext(key, context)
  };
}
