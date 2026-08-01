export const PAPELES_BOLETA = ['a4', 'oficio'] as const;
export type PapelBoleta = (typeof PAPELES_BOLETA)[number];

export const BOLETAS_POR_PAGINA = [2, 4] as const;
export type BoletasPorPagina = (typeof BOLETAS_POR_PAGINA)[number];

/** Oficio latinoamericano aproximado: 216 × 330 mm (en puntos PDF). */
const OFICIO_PAGE = { width: 612.28, height: 935.43 };

export const normalizePapelBoleta = (value?: string | null): PapelBoleta =>
  String(value || '')
    .trim()
    .toLowerCase() === 'oficio'
    ? 'oficio'
    : 'a4';

export const normalizeBoletasPorPagina = (value?: number | string | null): BoletasPorPagina =>
  Number(value) === 4 ? 4 : 2;

export const resolvePageSize = (papel?: string | null): 'A4' | { width: number; height: number } =>
  normalizePapelBoleta(papel) === 'oficio' ? OFICIO_PAGE : 'A4';

/** Ancho útil aproximado del contenido en puntos PDF (page − márgenes). */
export const contentWidthPt = (
  papel: string | null | undefined,
  margenMm: number
): number => {
  const page = resolvePageSize(papel);
  const pageWidth = typeof page === 'string' ? 595.28 : page.width;
  const marginPt = Math.max(10, Number(margenMm) || 20) * 2.834645669;
  return Math.max(200, pageWidth - marginPt * 2);
};
