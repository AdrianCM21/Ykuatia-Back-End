import { daysBetween } from './csv';

export const ESTADOS_COBRABLES = ['pendiente a pago', 'parcialmente pagado'] as const;

export const saldoFactura = (monto: number, montoPagado: number): number =>
  Math.max(0, Number(monto) - Number(montoPagado || 0));

/** Normaliza a medianoche local (útil para comparar solo fechas). */
export const startOfDay = (fecha: Date | string): Date => {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Moroso solo después de la fecha de vencimiento (no el mismo día de vencimiento).
 * Una factura del período actual aún no vencida no cuenta como mora.
 */
export const isFacturaVencida = (
  fechaVencimiento: Date | string | null | undefined,
  ahora: Date = new Date()
): boolean => {
  if (!fechaVencimiento) return false;
  return startOfDay(ahora).getTime() > startOfDay(fechaVencimiento).getTime();
};

/** Días corridos desde el vencimiento; 0 si aún no venció. */
export const diasDesdeVencimiento = (
  fechaVencimiento: Date | string | null | undefined,
  ahora: Date = new Date()
): number => {
  if (!fechaVencimiento || !isFacturaVencida(fechaVencimiento, ahora)) return 0;
  return daysBetween(startOfDay(fechaVencimiento), startOfDay(ahora));
};

/**
 * Recargo simple: saldo * (mora_pct/100) * ceil(días vencidos / 30) si vencida.
 * Si mora_pct es 0, no hay recargo.
 */
export const calcularRecargoMora = (params: {
  saldo: number;
  fechaVencimiento: Date | string;
  moraPct: number;
  ahora?: Date;
}): number => {
  const saldo = Number(params.saldo);
  const moraPct = Number(params.moraPct || 0);
  if (saldo <= 0 || moraPct <= 0) return 0;

  const ahora = params.ahora ?? new Date();
  if (!isFacturaVencida(params.fechaVencimiento, ahora)) return 0;

  const dias = diasDesdeVencimiento(params.fechaVencimiento, ahora);
  if (dias <= 0) return 0;

  const periodos = Math.max(1, Math.ceil(dias / 30));
  return Math.round(saldo * (moraPct / 100) * periodos);
};

export const addDias = (fecha: Date, dias: number): Date => {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
};
