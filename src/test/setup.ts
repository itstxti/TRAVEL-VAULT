import 'fake-indexeddb/auto';

// jsdom no implementa crypto.randomUUID en algunas versiones antiguas;
// nos aseguramos de que exista para utils.ts (id()).
if (!globalThis.crypto?.randomUUID) {
  // @ts-expect-error - polyfill mínimo solo para tests
  globalThis.crypto = { ...globalThis.crypto, randomUUID: () => 'test-uuid-' + Math.random().toString(16).slice(2) };
}