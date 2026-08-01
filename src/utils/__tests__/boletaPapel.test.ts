import {
  normalizeBoletasPorPagina,
  normalizePapelBoleta,
  resolvePageSize,
} from '../boletaPapel';

describe('boletaPapel', () => {
  it('normaliza papel a a4 u oficio', () => {
    expect(normalizePapelBoleta('A4')).toBe('a4');
    expect(normalizePapelBoleta('oficio')).toBe('oficio');
    expect(normalizePapelBoleta('xyz')).toBe('a4');
  });

  it('normaliza boletas por página a 2 o 4', () => {
    expect(normalizeBoletasPorPagina(4)).toBe(4);
    expect(normalizeBoletasPorPagina(2)).toBe(2);
    expect(normalizeBoletasPorPagina(99)).toBe(2);
  });

  it('resuelve pageSize A4 u oficio', () => {
    expect(resolvePageSize('a4')).toBe('A4');
    const oficio = resolvePageSize('oficio');
    expect(typeof oficio).toBe('object');
    if (typeof oficio !== 'string') {
      expect(oficio.height).toBeGreaterThan(oficio.width);
    }
  });
});
