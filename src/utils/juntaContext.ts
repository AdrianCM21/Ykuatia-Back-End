import { AsyncLocalStorage } from 'async_hooks';

type JuntaStore = { juntaId: number };

const storage = new AsyncLocalStorage<JuntaStore>();

export const runWithJunta = <T>(juntaId: number, fn: () => T): T =>
  storage.run({ juntaId }, fn);

export const getJuntaId = (): number => {
  const store = storage.getStore();
  if (!store?.juntaId) {
    throw new Error('Contexto de junta no disponible');
  }
  return store.juntaId;
};

export const tryGetJuntaId = (): number | null => storage.getStore()?.juntaId ?? null;
