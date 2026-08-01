import {
  addDias,
  calcularRecargoMora,
  diasDesdeVencimiento,
  ESTADOS_COBRABLES,
  isFacturaVencida,
  saldoFactura,
} from '../mora';

describe('mora utils', () => {
  describe('saldoFactura', () => {
    it('resta lo pagado del monto', () => {
      expect(saldoFactura(30000, 10000)).toBe(20000);
    });

    it('no baja de cero', () => {
      expect(saldoFactura(10000, 15000)).toBe(0);
    });

    it('trata monto_pagado nulo como 0', () => {
      expect(saldoFactura(25000, 0)).toBe(25000);
    });
  });

  describe('calcularRecargoMora', () => {
    const venc = new Date('2026-01-01T00:00:00Z');

    it('devuelve 0 si mora_pct es 0', () => {
      expect(
        calcularRecargoMora({
          saldo: 10000,
          fechaVencimiento: venc,
          moraPct: 0,
          ahora: new Date('2026-02-01T00:00:00Z'),
        })
      ).toBe(0);
    });

    it('devuelve 0 si aún no venció', () => {
      expect(
        calcularRecargoMora({
          saldo: 10000,
          fechaVencimiento: venc,
          moraPct: 5,
          ahora: new Date('2025-12-15T00:00:00Z'),
        })
      ).toBe(0);
    });

    it('aplica un período de 30 días', () => {
      expect(
        calcularRecargoMora({
          saldo: 10000,
          fechaVencimiento: venc,
          moraPct: 10,
          ahora: new Date('2026-01-15T00:00:00Z'),
        })
      ).toBe(1000);
    });

    it('acumula períodos de 30 días', () => {
      expect(
        calcularRecargoMora({
          saldo: 10000,
          fechaVencimiento: venc,
          moraPct: 10,
          ahora: new Date('2026-03-05T00:00:00Z'),
        })
      ).toBe(3000);
    });

    it('devuelve 0 con saldo 0', () => {
      expect(
        calcularRecargoMora({
          saldo: 0,
          fechaVencimiento: venc,
          moraPct: 10,
          ahora: new Date('2026-02-01T00:00:00Z'),
        })
      ).toBe(0);
    });
  });

  describe('isFacturaVencida', () => {
    it('no es morosa el mismo día del vencimiento', () => {
      expect(
        isFacturaVencida(new Date('2026-08-15T00:00:00'), new Date('2026-08-15T18:00:00'))
      ).toBe(false);
    });

    it('es morosa al día siguiente del vencimiento', () => {
      expect(
        isFacturaVencida(new Date('2026-08-15T00:00:00'), new Date('2026-08-16T08:00:00'))
      ).toBe(true);
    });

    it('sin fecha de vencimiento no es morosa', () => {
      expect(isFacturaVencida(null, new Date())).toBe(false);
    });
  });

  describe('diasDesdeVencimiento', () => {
    it('cuenta días solo si ya venció', () => {
      expect(
        diasDesdeVencimiento(new Date('2026-08-01T00:00:00'), new Date('2026-08-11T00:00:00'))
      ).toBe(10);
      expect(
        diasDesdeVencimiento(new Date('2026-08-20T00:00:00'), new Date('2026-08-11T00:00:00'))
      ).toBe(0);
    });
  });

  describe('addDias', () => {
    it('suma días a una fecha', () => {
      const base = new Date('2026-08-01T12:00:00Z');
      const result = addDias(base, 14);
      expect(result.getUTCDate()).toBe(15);
    });
  });

  it('incluye estados cobrables esperados', () => {
    expect(ESTADOS_COBRABLES).toEqual(['pendiente a pago', 'parcialmente pagado']);
  });
});
