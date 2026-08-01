import { Cliente } from '../models/clientes';
import { Factura } from '../models/facturas';
import {
  BoletaPdfData,
  JuntaPdfConfig,
  ReciboPdfData,
} from '../interfaces/facturas/boletaPdf';
import { ConfiguracionJunta } from '../models/configuracionJunta';
import { getAnioMesFromDate } from './anioMes';
import { addDias, saldoFactura } from './mora';
import { normalizeBoletasPorPagina, normalizePapelBoleta } from './boletaPapel';

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const toBoletaCliente = (cliente: Cliente | Pick<Cliente, 'nombre' | 'direccion' | 'cedula'>) => ({
  nombre: cliente.nombre || '-',
  direccion: cliente.direccion || '-',
  cedula: cliente.cedula || undefined,
});

export const toBoletaFromClienteFacturas = (
  cliente: Cliente,
  facturas: Factura[]
): BoletaPdfData | null => {
  if (!facturas.length) return null;
  const emision = new Date(facturas[0].Fecha_emicion || Date.now());
  const vencimiento = facturas[0].fecha_vencimiento
    ? new Date(facturas[0].fecha_vencimiento)
    : addDias(emision, 14);
  return {
    cliente: toBoletaCliente(cliente),
    emision,
    vencimiento,
    nroBoleta: facturas[0].nro_boleta,
    lineas: facturas.map((factura) => ({
      periodo:
        factura.anio_mes ||
        getAnioMesFromDate(new Date(factura.Fecha_emicion || Date.now())),
      consumo: Number(factura.consumo || 0),
      monto: Number(factura.monto || 0),
    })),
  };
};

export const toBoletasFromClientes = (
  items: { cliente: Cliente; facturas: Factura[] }[]
): BoletaPdfData[] =>
  items
    .map((item) => toBoletaFromClienteFacturas(item.cliente, item.facturas))
    .filter((item): item is BoletaPdfData => Boolean(item));

export const toReciboFromFacturas = (facturas: Factura[]): ReciboPdfData | null => {
  if (!facturas.length) return null;
  const cliente = facturas[0].cliente;
  return {
    cliente: toBoletaCliente({
      nombre: cliente?.nombre || '-',
      direccion: cliente?.direccion || '-',
      cedula: cliente?.cedula || '',
    }),
    fechaPago: new Date(),
    lineas: facturas.map((factura) => {
      const monto = Number(factura.monto || 0);
      const montoPagado = Number(factura.monto_pagado || 0);
      return {
        facturaId: factura.id,
        periodo: factura.anio_mes || '-',
        monto,
        montoPagado,
        saldo: saldoFactura(monto, montoPagado),
      };
    }),
  };
};

export const buildPreviewBoleta = (index = 0): BoletaPdfData => {
  const now = new Date();
  const n = index + 1;
  return {
    cliente: {
      nombre: index === 0 ? 'Cliente de ejemplo' : `Cliente de ejemplo ${n}`,
      direccion: 'Calle Principal 123',
      cedula: `${n}.000.000`,
    },
    emision: now,
    vencimiento: addDias(now, 14),
    nroBoleta: String(n).padStart(6, '0'),
    lineas: [
      {
        periodo: getAnioMesFromDate(now),
        consumo: 10 + n,
        monto: 40000 + n * 1000,
      },
    ],
  };
};

/** Genera N boletas de ejemplo (útil para vista previa de varias por hoja). */
export const buildPreviewBoletas = (count: number): BoletaPdfData[] =>
  Array.from({ length: Math.max(1, count) }, (_, i) => buildPreviewBoleta(i));

export const sanitizeJuntaPdfConfig = (
  base: ConfiguracionJunta,
  draft?: Partial<JuntaPdfConfig> | Record<string, unknown>
): JuntaPdfConfig => {
  const source = (draft || {}) as Partial<JuntaPdfConfig>;
  const pick = (key: keyof JuntaPdfConfig, fallback: string): string => {
    const value = source[key];
    return typeof value === 'string' ? value : fallback;
  };

  const colorPrimario = pick('color_primario', base.color_primario);
  const colorSecundario = pick('color_secundario', base.color_secundario);
  const margen =
    typeof source.margen_mm === 'number'
      ? source.margen_mm
      : Number(base.margen_mm || 40);

  return {
    nombre: pick('nombre', base.nombre),
    slogan: pick('slogan', base.slogan),
    direccion: pick('direccion', base.direccion),
    telefono: pick('telefono', base.telefono),
    email: pick('email', base.email),
    pie_boleta: pick('pie_boleta', base.pie_boleta),
    pie_recibo: pick('pie_recibo', base.pie_recibo),
    color_primario: HEX.test(colorPrimario) ? colorPrimario : '#0B6E6E',
    color_secundario: HEX.test(colorSecundario) ? colorSecundario : '#1F4E79',
    logo_principal:
      typeof source.logo_principal === 'string' || source.logo_principal === null
        ? source.logo_principal
        : base.logo_principal,
    logo_secundario:
      typeof source.logo_secundario === 'string' || source.logo_secundario === null
        ? source.logo_secundario
        : base.logo_secundario,
    margen_mm: Number.isFinite(margen) ? margen : 40,
    mostrar_timbrado:
      typeof source.mostrar_timbrado === 'boolean'
        ? source.mostrar_timbrado
        : Boolean(base.mostrar_timbrado),
    timbrado: pick('timbrado', base.timbrado || ''),
    ruc: pick('ruc', base.ruc || ''),
    plantilla_boleta: pick('plantilla_boleta', base.plantilla_boleta || 'clasica'),
    papel_boleta: normalizePapelBoleta(
      typeof source.papel_boleta === 'string' ? source.papel_boleta : base.papel_boleta
    ),
    boletas_por_pagina: normalizeBoletasPorPagina(
      typeof source.boletas_por_pagina === 'number'
        ? source.boletas_por_pagina
        : base.boletas_por_pagina
    ),
  };
};
