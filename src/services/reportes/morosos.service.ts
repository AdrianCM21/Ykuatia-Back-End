import { AppDataSource } from '../../config/db.config';
import { Factura } from '../../models/facturas';
import { agingBucket, toCsv } from '../../utils/csv';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId } from '../../utils/juntaContext';
import {
  calcularRecargoMora,
  diasDesdeVencimiento,
  ESTADOS_COBRABLES,
  isFacturaVencida,
  saldoFactura,
} from '../../utils/mora';
import { getJuntaConfig } from '../junta/junta.service';

export type MorosoBucket = '0-30' | '31-60' | '61-90' | '90+';

export type MorosoRow = {
  id_cliente: number;
  nombre: string;
  cedula: string;
  telefono: string;
  nro_medidor: string | null;
  monto_deuda: number;
  recargo_estimado: number;
  facturas_pendientes: number;
  factura_mas_antigua: string;
  fecha_vencimiento: string;
  dias_mora: number;
  bucket: MorosoBucket;
};

export type MorososResumen = {
  total_clientes: number;
  deuda_total: number;
  recargo_total: number;
  por_bucket: Record<MorosoBucket, { clientes: number; deuda: number }>;
};

const emptyBucketResumen = (): MorososResumen['por_bucket'] => ({
  '0-30': { clientes: 0, deuda: 0 },
  '31-60': { clientes: 0, deuda: 0 },
  '61-90': { clientes: 0, deuda: 0 },
  '90+': { clientes: 0, deuda: 0 },
});

const loadMorosos = async (params: { q?: string; bucket?: string }): Promise<MorosoRow[]> => {
  const juntaId = getJuntaId();
  const junta = await getJuntaConfig();
  const moraPct = Number(junta.mora_pct || 0);
  const ahora = new Date();

  const facturas = await AppDataSource.getRepository(Factura)
    .createQueryBuilder('f')
    .innerJoinAndSelect('f.cliente', 'c')
    .where('f.delete = false')
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .andWhere('f.estado IN (:...estados)', { estados: [...ESTADOS_COBRABLES] })
    .andWhere('c.delete = false')
    .andWhere('f.fecha_vencimiento IS NOT NULL')
    .andWhere('DATE(f.fecha_vencimiento) < DATE(:hoy)', {
      hoy: ahora.toISOString().slice(0, 10),
    })
    .getMany();

  const byCliente = new Map<
    number,
    {
      cliente: Factura['cliente'];
      facturas: Factura[];
    }
  >();

  for (const f of facturas) {
    const saldo = saldoFactura(Number(f.monto), Number(f.monto_pagado || 0));
    if (saldo <= 0) continue;
    if (!isFacturaVencida(f.fecha_vencimiento, ahora)) continue;

    const id = f.cliente.id;
    const entry = byCliente.get(id) || { cliente: f.cliente, facturas: [] };
    entry.facturas.push(f);
    byCliente.set(id, entry);
  }

  let mapped: MorosoRow[] = [];

  for (const { cliente, facturas: fs } of byCliente.values()) {
    if (params.q) {
      const q = params.q.toLowerCase();
      const hay =
        cliente.nombre.toLowerCase().includes(q) ||
        cliente.cedula.toLowerCase().includes(q) ||
        (cliente.telefono || '').toLowerCase().includes(q);
      if (!hay) continue;
    }

    let montoDeuda = 0;
    let recargo = 0;
    let minVenc = new Date(fs[0].fecha_vencimiento);
    let minEmision = new Date(fs[0].Fecha_emicion);

    for (const f of fs) {
      const saldo = saldoFactura(Number(f.monto), Number(f.monto_pagado || 0));
      montoDeuda += saldo;
      recargo += calcularRecargoMora({
        saldo,
        fechaVencimiento: f.fecha_vencimiento,
        moraPct,
        ahora,
      });
      const venc = new Date(f.fecha_vencimiento);
      if (venc < minVenc) minVenc = venc;
      const em = new Date(f.Fecha_emicion);
      if (em < minEmision) minEmision = em;
    }

    const dias = diasDesdeVencimiento(minVenc, ahora);
    if (dias <= 0) continue;

    mapped.push({
      id_cliente: cliente.id,
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      telefono: cliente.telefono,
      nro_medidor: cliente.nro_medidor,
      monto_deuda: montoDeuda,
      recargo_estimado: recargo,
      facturas_pendientes: fs.length,
      factura_mas_antigua: minEmision.toISOString(),
      fecha_vencimiento: minVenc.toISOString(),
      dias_mora: dias,
      bucket: agingBucket(dias),
    });
  }

  if (params.bucket) {
    mapped = mapped.filter((m) => m.bucket === params.bucket);
  }
  return mapped.sort((a, b) => b.dias_mora - a.dias_mora || b.monto_deuda - a.monto_deuda);
};

const buildResumen = (rows: MorosoRow[]): MorososResumen => {
  const por_bucket = emptyBucketResumen();
  let deuda_total = 0;
  let recargo_total = 0;
  for (const row of rows) {
    deuda_total += row.monto_deuda;
    recargo_total += row.recargo_estimado;
    por_bucket[row.bucket].clientes += 1;
    por_bucket[row.bucket].deuda += row.monto_deuda;
  }
  return {
    total_clientes: rows.length,
    deuda_total,
    recargo_total,
    por_bucket,
  };
};

export const getMorosos = async (params: {
  q?: string;
  bucket?: string;
  page?: string | number;
  limit?: string | number;
}) => {
  // Resumen siempre sobre todos los morosos (filtro q), sin recortar por bucket
  const allForResumen = await loadMorosos({ q: params.q });
  const resumen = buildResumen(allForResumen);
  const all = params.bucket
    ? allForResumen.filter((m) => m.bucket === params.bucket)
    : allForResumen;
  const { skip, limit, page } = resolvePagination(params);
  return {
    resultado: all.slice(skip, skip + limit),
    total: all.length,
    page,
    limit,
    resumen,
  };
};

export const exportMorososCsv = async (params: { q?: string; bucket?: string }) => {
  const all = await loadMorosos(params);
  return toCsv(
    [
      'id_cliente',
      'nombre',
      'cedula',
      'telefono',
      'nro_medidor',
      'monto_deuda',
      'recargo_estimado',
      'facturas_pendientes',
      'factura_mas_antigua',
      'fecha_vencimiento',
      'dias_mora',
      'bucket',
    ],
    all.map((m) => [
      m.id_cliente,
      m.nombre,
      m.cedula,
      m.telefono,
      m.nro_medidor,
      m.monto_deuda,
      m.recargo_estimado,
      m.facturas_pendientes,
      m.factura_mas_antigua,
      m.fecha_vencimiento,
      m.dias_mora,
      m.bucket,
    ])
  );
};
