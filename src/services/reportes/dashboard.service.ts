import { AppDataSource } from '../../config/db.config';
import { Factura } from '../../models/facturas';
import { Transaccion } from '../../models/trasacciones';
import { getJuntaId } from '../../utils/juntaContext';
import { agingBucket } from '../../utils/csv';
import {
  calcularRecargoMora,
  diasDesdeVencimiento,
  ESTADOS_COBRABLES,
  isFacturaVencida,
  saldoFactura,
} from '../../utils/mora';
import { getJuntaConfig } from '../junta/junta.service';
import { getMorosos } from './morosos.service';

const parseDate = (value?: string, endOfDay = false): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
};

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const getDashboard = async (params: { desde?: string; hasta?: string }) => {
  const juntaId = getJuntaId();
  const junta = await getJuntaConfig();
  const hasta = parseDate(params.hasta, true) || new Date();
  const desde =
    parseDate(params.desde) ||
    new Date(hasta.getFullYear(), hasta.getMonth() - 5, 1);

  const txRepo = AppDataSource.getRepository(Transaccion);
  const factRepo = AppDataSource.getRepository(Factura);

  const ingresosRaw = await txRepo
    .createQueryBuilder('t')
    .leftJoin('t.tipo_ingreso', 'tipo')
    .select("DATE_FORMAT(t.fecha, '%Y-%m')", 'periodo')
    .addSelect('SUM(t.monto)', 'total')
    .where('t.delete = false')
    .andWhere('t.id_junta = :juntaId', { juntaId })
    .andWhere('tipo.descripcion = :ing', { ing: 'Ingreso' })
    .andWhere('t.fecha BETWEEN :desde AND :hasta', { desde, hasta })
    .groupBy('periodo')
    .orderBy('periodo', 'ASC')
    .getRawMany<{ periodo: string; total: string }>();

  const cobrado = await txRepo
    .createQueryBuilder('t')
    .leftJoin('t.tipo_ingreso', 'tipo')
    .select('COALESCE(SUM(t.monto),0)', 'total')
    .where('t.delete = false')
    .andWhere('t.id_junta = :juntaId', { juntaId })
    .andWhere('tipo.descripcion = :ing', { ing: 'Ingreso' })
    .andWhere('t.fecha BETWEEN :desde AND :hasta', { desde, hasta })
    .getRawOne<{ total: string }>();

  const facturasAbiertas = await factRepo
    .createQueryBuilder('f')
    .leftJoinAndSelect('f.cliente', 'c')
    .where('f.delete = false')
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .andWhere('f.estado IN (:...estados)', { estados: [...ESTADOS_COBRABLES] })
    .getMany();

  let deudaTotal = 0;
  let recargoTotal = 0;
  const buckets: Record<string, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  const ahora = new Date();

  for (const f of facturasAbiertas) {
    const saldo = saldoFactura(Number(f.monto), Number(f.monto_pagado || 0));
    deudaTotal += saldo;
    // Aging de mora solo con facturas ya vencidas (no el período actual sin vencer)
    if (isFacturaVencida(f.fecha_vencimiento, ahora) && saldo > 0) {
      const dias = diasDesdeVencimiento(f.fecha_vencimiento, ahora);
      buckets[agingBucket(dias)] += saldo;
    }
    recargoTotal += calcularRecargoMora({
      saldo,
      fechaVencimiento: f.fecha_vencimiento,
      moraPct: Number(junta.mora_pct || 0),
      ahora,
    });
  }

  const mesActual = monthKey(ahora);
  const mesAnteriorDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const mesAnterior = monthKey(mesAnteriorDate);

  const sumMes = async (periodo: string) => {
    const row = await txRepo
      .createQueryBuilder('t')
      .leftJoin('t.tipo_ingreso', 'tipo')
      .select('COALESCE(SUM(t.monto),0)', 'total')
      .where('t.delete = false')
      .andWhere('t.id_junta = :juntaId', { juntaId })
      .andWhere('tipo.descripcion = :ing', { ing: 'Ingreso' })
      .andWhere("DATE_FORMAT(t.fecha, '%Y-%m') = :periodo", { periodo })
      .getRawOne<{ total: string }>();
    return Number(row?.total || 0);
  };

  const cobradoMesActual = await sumMes(mesActual);
  const cobradoMesAnterior = await sumMes(mesAnterior);

  const morosos = await getMorosos({ page: 1, limit: 10 });

  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    kpis: {
      cobradoPeriodo: Number(cobrado?.total || 0),
      deudaTotal,
      recargoEstimado: recargoTotal,
      facturasAbiertas: facturasAbiertas.length,
      cobradoMesActual,
      cobradoMesAnterior,
      variacionMesPct:
        cobradoMesAnterior > 0
          ? Math.round(((cobradoMesActual - cobradoMesAnterior) / cobradoMesAnterior) * 1000) / 10
          : null,
    },
    serieCobranza: ingresosRaw.map((r) => ({
      periodo: r.periodo,
      total: Number(r.total || 0),
    })),
    cobranzaPorBucket: Object.entries(buckets).map(([bucket, monto]) => ({ bucket, monto })),
    topMorosos: morosos.resultado,
  };
};
