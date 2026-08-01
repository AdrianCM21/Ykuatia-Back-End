import { agingBucket, daysBetween, toCsv } from '../csv';

describe('csv utils', () => {
  describe('agingBucket', () => {
    it('clasifica tramos', () => {
      expect(agingBucket(0)).toBe('0-30');
      expect(agingBucket(30)).toBe('0-30');
      expect(agingBucket(31)).toBe('31-60');
      expect(agingBucket(60)).toBe('31-60');
      expect(agingBucket(61)).toBe('61-90');
      expect(agingBucket(90)).toBe('61-90');
      expect(agingBucket(91)).toBe('90+');
    });
  });

  describe('daysBetween', () => {
    it('calcula días enteros positivos', () => {
      const from = new Date('2026-01-01T00:00:00Z');
      const to = new Date('2026-01-11T00:00:00Z');
      expect(daysBetween(from, to)).toBe(10);
    });

    it('no devuelve negativos', () => {
      const from = new Date('2026-01-11T00:00:00Z');
      const to = new Date('2026-01-01T00:00:00Z');
      expect(daysBetween(from, to)).toBe(0);
    });
  });

  describe('toCsv', () => {
    it('incluye BOM y escapa comillas', () => {
      const csv = toCsv(['nombre', 'nota'], [['Juan', 'dijo "hola"'], ['Ana', null]]);
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('nombre,nota');
      expect(csv).toContain('"dijo ""hola"""');
      expect(csv).toContain('Ana,');
    });
  });
});
