import { getAnioMesActual, getAnioMesFromDate } from '../anioMes';

describe('anioMes', () => {
  it('formatea YYYY-MM', () => {
    expect(getAnioMesActual(new Date(2026, 7, 1))).toBe('2026-08');
    expect(getAnioMesFromDate(new Date(2025, 0, 15))).toBe('2025-01');
  });
});
