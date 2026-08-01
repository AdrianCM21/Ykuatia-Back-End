import { getJuntaId, runWithJunta, tryGetJuntaId } from '../juntaContext';

describe('juntaContext', () => {
  it('propaga juntaId dentro de runWithJunta', () => {
    expect(tryGetJuntaId()).toBeNull();
    const value = runWithJunta(7, () => getJuntaId());
    expect(value).toBe(7);
    expect(tryGetJuntaId()).toBeNull();
  });

  it('lanza si se pide juntaId fuera de contexto', () => {
    expect(() => getJuntaId()).toThrow('Contexto de junta no disponible');
  });
});
