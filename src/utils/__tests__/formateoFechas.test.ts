import { formateoMes, formatDateDiaMesAño } from '../formateoFechas';

describe('formateoFechas', () => {
  it('formatea día/mes/año', () => {
    expect(formatDateDiaMesAño(new Date(2026, 7, 1))).toBe('1/8/2026');
  });

  it('devuelve nombre del mes', () => {
    expect(formateoMes(new Date(2026, 7, 1))).toBe('Agosto');
  });
});
