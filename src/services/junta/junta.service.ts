import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../../config/db.config';
import { ConfiguracionJunta } from '../../models/configuracionJunta';
import { JUNTA_UPLOADS_DIR } from '../../config/upload.config';
import { getJuntaId, tryGetJuntaId } from '../../utils/juntaContext';
import {
  BOLETAS_POR_PAGINA,
  normalizeBoletasPorPagina,
  normalizePapelBoleta,
  PAPELES_BOLETA,
} from '../../utils/boletaPapel';

const repo = () => AppDataSource.getRepository(ConfiguracionJunta);

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const PLANTILLAS = ['clasica', 'compacta', 'formal', 'basica'] as const;

export type JuntaUpdateInput = Partial<{
  nombre: string;
  slogan: string;
  direccion: string;
  telefono: string;
  email: string;
  pie_boleta: string;
  pie_recibo: string;
  color_primario: string;
  color_secundario: string;
  margen_mm: number;
  mostrar_timbrado: boolean;
  timbrado: string;
  ruc: string;
  dias_gracia: number;
  mora_pct: number;
  plantilla_boleta: string;
  papel_boleta: string;
  boletas_por_pagina: number;
}>;

const resolveJuntaId = () => tryGetJuntaId() ?? getJuntaId();

export const getJuntaConfig = async (): Promise<ConfiguracionJunta> => {
  const juntaId = resolveJuntaId();
  let config = await repo().findOne({ where: { id_junta: juntaId } });
  if (!config) {
    config = repo().create({
      nombre: 'Ykuatia ñangareko',
      slogan: 'Cuidamos el agua de la comunidad',
      direccion: '',
      telefono: '',
      email: '',
      pie_boleta: 'El agua es un tesoro. Usala con responsabilidad.',
      pie_recibo: 'Gracias por tu pago. Conservá este recibo como comprobante.',
      color_primario: '#0B6E6E',
      color_secundario: '#1F4E79',
      margen_mm: 40,
      mostrar_timbrado: false,
      timbrado: '',
      ruc: '',
      nro_boleta_actual: 1,
      dias_gracia: 14,
      mora_pct: 0,
      plantilla_boleta: 'clasica',
      papel_boleta: 'a4',
      boletas_por_pagina: 2,
      version: 1,
      id_junta: juntaId,
    });
    config = await repo().save(config);
  }
  return config;
};

export const updateJuntaConfig = async (data: JuntaUpdateInput): Promise<ConfiguracionJunta> => {
  const config = await getJuntaConfig();

  if (data.color_primario && !HEX_COLOR.test(data.color_primario)) {
    throw new Error('color_primario inválido');
  }
  if (data.color_secundario && !HEX_COLOR.test(data.color_secundario)) {
    throw new Error('color_secundario inválido');
  }
  if (data.plantilla_boleta && !PLANTILLAS.includes(data.plantilla_boleta as (typeof PLANTILLAS)[number])) {
    throw new Error('plantilla_boleta inválida');
  }
  if (data.papel_boleta != null) {
    const papel = String(data.papel_boleta).trim().toLowerCase();
    if (!PAPELES_BOLETA.includes(papel as (typeof PAPELES_BOLETA)[number])) {
      throw new Error('papel_boleta inválido (usá a4 u oficio)');
    }
  }
  if (data.boletas_por_pagina != null) {
    const n = Number(data.boletas_por_pagina);
    if (!BOLETAS_POR_PAGINA.includes(n as (typeof BOLETAS_POR_PAGINA)[number])) {
      throw new Error('boletas_por_pagina inválido (2 o 4)');
    }
  }

  Object.assign(config, {
    nombre: data.nombre ?? config.nombre,
    slogan: data.slogan ?? config.slogan,
    direccion: data.direccion ?? config.direccion,
    telefono: data.telefono ?? config.telefono,
    email: data.email ?? config.email,
    pie_boleta: data.pie_boleta ?? config.pie_boleta,
    pie_recibo: data.pie_recibo ?? config.pie_recibo,
    color_primario: data.color_primario ?? config.color_primario,
    color_secundario: data.color_secundario ?? config.color_secundario,
    margen_mm: data.margen_mm != null ? Number(data.margen_mm) : config.margen_mm,
    mostrar_timbrado:
      data.mostrar_timbrado != null ? Boolean(data.mostrar_timbrado) : config.mostrar_timbrado,
    timbrado: data.timbrado ?? config.timbrado,
    ruc: data.ruc ?? config.ruc,
    dias_gracia: data.dias_gracia != null ? Number(data.dias_gracia) : config.dias_gracia,
    mora_pct: data.mora_pct != null ? Number(data.mora_pct) : config.mora_pct,
    plantilla_boleta: data.plantilla_boleta ?? config.plantilla_boleta,
    papel_boleta:
      data.papel_boleta != null
        ? normalizePapelBoleta(data.papel_boleta)
        : normalizePapelBoleta(config.papel_boleta),
    boletas_por_pagina:
      data.boletas_por_pagina != null
        ? normalizeBoletasPorPagina(data.boletas_por_pagina)
        : normalizeBoletasPorPagina(config.boletas_por_pagina),
  });
  config.version = Number(config.version) + 1;
  return repo().save(config);
};

export const nextNroBoleta = async (): Promise<string> => {
  const config = await getJuntaConfig();
  const nro = Number(config.nro_boleta_actual || 1);
  config.nro_boleta_actual = nro + 1;
  await repo().save(config);
  return String(nro).padStart(6, '0');
};

const deleteLogoFile = (relativePath?: string | null) => {
  if (!relativePath) return;
  const abs = path.join(process.cwd(), relativePath.replace(/^\//, ''));
  if (fs.existsSync(abs) && abs.startsWith(JUNTA_UPLOADS_DIR)) {
    fs.unlinkSync(abs);
  }
};

export const setJuntaLogo = async (
  tipo: 'principal' | 'secundario',
  relativePath: string
): Promise<ConfiguracionJunta> => {
  const config = await getJuntaConfig();
  const prev = tipo === 'principal' ? config.logo_principal : config.logo_secundario;
  deleteLogoFile(prev);
  if (tipo === 'principal') {
    config.logo_principal = relativePath;
  } else {
    config.logo_secundario = relativePath;
  }
  config.version = Number(config.version) + 1;
  return repo().save(config);
};

/** Quita el logo de la config y borra el archivo del disco. */
export const clearJuntaLogo = async (
  tipo: 'principal' | 'secundario'
): Promise<ConfiguracionJunta> => {
  const config = await getJuntaConfig();
  if (tipo === 'principal') {
    deleteLogoFile(config.logo_principal);
    config.logo_principal = null;
  } else {
    deleteLogoFile(config.logo_secundario);
    config.logo_secundario = null;
  }
  config.version = Number(config.version) + 1;
  return repo().save(config);
};

export const toPublicJunta = (config: ConfiguracionJunta) => ({
  ...config,
  logo_principal_url: config.logo_principal || null,
  logo_secundario_url: config.logo_secundario || null,
});
