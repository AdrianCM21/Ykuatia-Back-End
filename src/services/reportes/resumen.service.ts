import { AppDataSource } from '../../config/db.config';
import { Factura } from '../../models/facturas';
import { getJuntaId } from '../../utils/juntaContext';
import { getCajaResumen } from '../transaciones/transaciones.service';

export const getReporteResumen = async (params: { desde?: string; hasta?: string }) => {
  const juntaId = getJuntaId();
  const desde = params.desde || `${new Date().getFullYear()}-01-01`;
  const hasta = params.hasta || new Date().toISOString().slice(0, 10);

  const desdeDate = new Date(`${desde}T00:00:00`);
  const hastaDate = new Date(`${hasta}T23:59:59`);

  const facturaRepo = AppDataSource.getRepository(Factura);

  const totals = await facturaRepo
    .createQueryBuilder('f')
    .select("SUM(CASE WHEN f.estado = 'pagado' THEN f.monto_pagado ELSE 0 END)", 'totalRecaudado')
    .addSelect(
      "SUM(CASE WHEN f.estado IN ('pagado', 'pendiente a pago', 'parcialmente pagado') THEN f.monto ELSE 0 END)",
      'totalFacturado'
    )
    .addSelect(
      "SUM(CASE WHEN f.estado IN ('pendiente a pago', 'parcialmente pagado') THEN (f.monto - f.monto_pagado) ELSE 0 END)",
      'totalPendiente'
    )
    .addSelect('SUM(f.consumo)', 'm3Consumidos')
    .where('f.delete = false')
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .andWhere('f.Fecha_emicion BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
    .getRawOne<{
      totalRecaudado: string;
      totalFacturado: string;
      totalPendiente: string;
      m3Consumidos: string;
    }>();

  const totalRecaudado = Number(totals?.totalRecaudado || 0);
  const totalFacturado = Number(totals?.totalFacturado || 0);
  const totalPendiente = Number(totals?.totalPendiente || 0);
  const m3Consumidos = Number(totals?.m3Consumidos || 0);
  const baseCobranza = totalRecaudado + totalPendiente;
  const cobranzaPct = baseCobranza > 0 ? Math.round((totalRecaudado / baseCobranza) * 1000) / 10 : 0;

  const caja = await getCajaResumen({ desdeFecha: desde, hastaFecha: hasta });

  const seriesRaw = await facturaRepo
    .createQueryBuilder('f')
    .select('f.anio_mes', 'mes')
    .addSelect(
      "SUM(CASE WHEN f.estado IN ('pagado', 'pendiente a pago', 'parcialmente pagado') THEN f.monto ELSE 0 END)",
      'facturado'
    )
    .addSelect("SUM(CASE WHEN f.estado = 'pagado' THEN f.monto_pagado ELSE f.monto_pagado END)", 'cobrado')
    .addSelect('SUM(f.consumo)', 'm3')
    .where('f.delete = false')
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .andWhere('f.Fecha_emicion BETWEEN :desde AND :hasta', { desde: desdeDate, hasta: hastaDate })
    .groupBy('f.anio_mes')
    .orderBy('f.anio_mes', 'ASC')
    .getRawMany<{ mes: string; facturado: string; cobrado: string; m3: string }>();

  const seriesMensuales = seriesRaw.map((row) => ({
    mes: row.mes,
    facturado: Number(row.facturado || 0),
    cobrado: Number(row.cobrado || 0),
    m3: Number(row.m3 || 0),
  }));

  // Moroso = cliente con al menos una factura vencida (después de fecha_vencimiento)
  const hoy = new Date().toISOString().slice(0, 10);
  const morososCount = await facturaRepo
    .createQueryBuilder('f')
    .innerJoin('f.cliente', 'c')
    .select('COUNT(DISTINCT c.id)', 'total')
    .where('f.delete = false')
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .andWhere("f.estado IN ('pendiente a pago', 'parcialmente pagado')")
    .andWhere('c.delete = false')
    .andWhere('f.fecha_vencimiento IS NOT NULL')
    .andWhere('DATE(f.fecha_vencimiento) < DATE(:hoy)', { hoy })
    .andWhere('(f.monto - COALESCE(f.monto_pagado, 0)) > 0')
    .getRawOne<{ total: string }>();

  return {
    desde,
    hasta,
    cobranzaPct,
    totalFacturado,
    totalRecaudado,
    totalPendiente,
    m3Consumidos,
    ingresos: caja.ingresos,
    egresos: caja.egresos,
    saldo: caja.saldo,
    morosos: Number(morososCount?.total || 0),
    seriesMensuales,
  };
};
