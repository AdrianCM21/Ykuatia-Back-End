import fs from 'fs';
import path from 'path';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import {
  BoletaPdfData,
  JuntaPdfConfig,
  ReciboPdfData,
} from '../../interfaces/facturas/boletaPdf';
import { getJuntaConfig } from '../junta/junta.service';
import { sanitizeJuntaPdfConfig } from '../../utils/boletaData';
import {
  contentWidthPt,
  normalizeBoletasPorPagina,
  resolvePageSize,
} from '../../utils/boletaPapel';

const resolveVfs = (): Record<string, string> | null => {
  const fonts = pdfFonts as unknown as Record<string, unknown>;
  if (fonts.pdfMake && typeof fonts.pdfMake === 'object') {
    const nested = (fonts.pdfMake as { vfs?: Record<string, string> }).vfs;
    if (nested) return nested;
  }
  if (fonts.vfs && typeof fonts.vfs === 'object') {
    return fonts.vfs as Record<string, string>;
  }
  if (typeof fonts['Roboto-Regular.ttf'] === 'string') {
    return fonts as Record<string, string>;
  }
  return null;
};

const vfs = resolveVfs();
if (vfs) {
  pdfMake.vfs = vfs;
}

const readLogoDataUrl = (relativePath?: string | null): string | null => {
  if (!relativePath || typeof relativePath !== 'string') return null;
  const abs = path.join(process.cwd(), relativePath.replace(/^\//, ''));
  if (!fs.existsSync(abs)) return null;
  const ext = path.extname(abs).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext === 'webp' ? 'webp' : 'png';
  const base64 = fs.readFileSync(abs).toString('base64');
  return `data:image/${mime};base64,${base64}`;
};

const buildStyles = (config: JuntaPdfConfig): StyleDictionary => ({
  header: {
    fontSize: 18,
    bold: true,
    color: config.color_primario,
    margin: [0, 10, 0, 0],
  },
  subheader: {
    fontSize: 13,
    bold: true,
    color: config.color_secundario,
    margin: [0, 6, 0, 4],
  },
  tableExample: {
    margin: [0, 5, 0, 15],
  },
});

const logoBlock = (config: JuntaPdfConfig, width = 70): Content[] => {
  const logo = readLogoDataUrl(config.logo_principal);
  if (!logo) return [];
  return [{ image: logo, width, alignment: 'center', margin: [0, 0, 0, 8] }];
};

const generateLine = (width = 515): Content => ({
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 1 }],
  margin: [0, 10, 0, 0],
});

const dashedCutLine = (width: number): Content => ({
  canvas: [
    {
      type: 'line',
      x1: 0,
      y1: 0,
      x2: width,
      y2: 0,
      lineWidth: 0.8,
      dash: { length: 4, space: 3 },
      lineColor: '#888888',
    },
  ],
  margin: [0, 6, 0, 6],
});

const timbradoBlock = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  if (config.mostrar_timbrado) {
    return [
      {
        text: `RUC: ${config.ruc || '-'}  |  Timbrado: ${config.timbrado || '-'}  |  Boleta N° ${boleta.nroBoleta || '-'}`,
        alignment: 'center',
        fontSize: 9,
        margin: [0, 0, 0, 8],
      },
    ];
  }
  if (boleta.nroBoleta) {
    return [{ text: `Boleta N° ${boleta.nroBoleta}`, alignment: 'center', fontSize: 9, margin: [0, 0, 0, 8] }];
  }
  return [];
};

const buildClasica = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  const total = boleta.lineas.reduce((sum, linea) => sum + Number(linea.monto), 0);
  return [
    generateLine(),
    ...logoBlock(config),
    { text: 'BOLETA DE AGUA', style: 'header', alignment: 'center' },
    { text: config.nombre, style: 'subheader', alignment: 'center' },
    { text: config.slogan || '', alignment: 'center', margin: [0, 0, 0, 8], fontSize: 10 },
    ...timbradoBlock(boleta, config),
    {
      table: {
        widths: ['*', '*'],
        body: [
          [
            {
              stack: [
                { text: 'Datos de la junta', style: 'subheader' },
                { text: `Nombre: ${config.nombre}`, margin: [0, 4, 0, 0] },
                { text: `Dirección: ${config.direccion || '-'}`, margin: [0, 4, 0, 0] },
                { text: `Teléfono: ${config.telefono || '-'}`, margin: [0, 4, 0, 0] },
                { text: `Email: ${config.email || '-'}`, margin: [0, 4, 0, 0] },
              ],
              margin: [0, 0, 10, 16],
            },
            {
              stack: [
                { text: 'Datos del cliente', style: 'subheader' },
                { text: `Nombre: ${boleta.cliente.nombre}`, margin: [0, 4, 0, 0] },
                { text: `Dirección: ${boleta.cliente.direccion}`, margin: [0, 4, 0, 0] },
                ...(boleta.cliente.cedula
                  ? [{ text: `Cédula: ${boleta.cliente.cedula}`, margin: [0, 4, 0, 0] as [number, number, number, number] }]
                  : []),
              ],
              margin: [10, 0, 0, 16],
            },
          ],
        ],
      },
      layout: 'noBorders',
    },
    {
      table: {
        widths: ['*', '*'],
        body: [
          [{ text: 'Detalles de la factura', style: 'header', colSpan: 2, alignment: 'center' }, {}],
          [
            { text: `Emisión: ${boleta.emision.toLocaleDateString('es-PY')}`, margin: [0, 5, 0, 0] },
            {
              text: `Vencimiento: ${boleta.vencimiento.toLocaleDateString('es-PY')}`,
              margin: [0, 5, 0, 0],
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 16],
    },
    {
      style: 'tableExample',
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            { text: 'Período', bold: true },
            { text: 'Consumo', bold: true },
            { text: 'Monto', bold: true },
          ],
          ...boleta.lineas.map((linea) => [
            linea.periodo,
            `${linea.consumo}`,
            `${linea.monto} Gs`,
          ]),
          [{ text: 'Total', bold: true }, '', { text: `${total} Gs`, bold: true }],
        ],
      },
    },
    generateLine(),
    {
      text: config.pie_boleta || '',
      style: 'subheader',
      alignment: 'center',
      margin: [0, 16, 0, 16],
    },
    generateLine(),
  ];
};

const buildCompacta = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  const total = boleta.lineas.reduce((sum, linea) => sum + Number(linea.monto), 0);
  return [
    {
      columns: [
        { stack: logoBlock(config, 48), width: 60 },
        {
          stack: [
            { text: config.nombre, bold: true, fontSize: 14, color: config.color_primario },
            { text: 'BOLETA DE AGUA', fontSize: 11, color: config.color_secundario },
            { text: config.slogan || '', fontSize: 9 },
          ],
          margin: [8, 0, 0, 0],
        },
      ],
      margin: [0, 0, 0, 8],
    },
    ...timbradoBlock(boleta, config),
    {
      text: `${boleta.cliente.nombre} · ${boleta.cliente.cedula || '-'} · ${boleta.cliente.direccion}`,
      fontSize: 10,
      margin: [0, 0, 0, 6],
    },
    {
      text: `Emisión ${boleta.emision.toLocaleDateString('es-PY')}  ·  Vence ${boleta.vencimiento.toLocaleDateString('es-PY')}`,
      fontSize: 10,
      margin: [0, 0, 0, 8],
    },
    {
      table: {
        widths: ['*', 'auto', 'auto'],
        body: [
          [
            { text: 'Período', bold: true, fontSize: 10 },
            { text: 'm³', bold: true, fontSize: 10 },
            { text: 'Gs', bold: true, fontSize: 10 },
          ],
          ...boleta.lineas.map((l) => [
            { text: l.periodo, fontSize: 10 },
            { text: String(l.consumo), fontSize: 10 },
            { text: String(l.monto), fontSize: 10 },
          ]),
          [
            { text: 'TOTAL', bold: true, fontSize: 11 },
            '',
            { text: String(total), bold: true, fontSize: 11 },
          ],
        ],
      },
      layout: 'lightHorizontalLines',
    },
    { text: config.pie_boleta || '', fontSize: 9, margin: [0, 12, 0, 0], alignment: 'center' },
  ];
};

const buildFormal = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  const total = boleta.lineas.reduce((sum, linea) => sum + Number(linea.monto), 0);
  return [
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              fillColor: config.color_primario,
              color: '#ffffff',
              stack: [
                { text: config.nombre.toUpperCase(), bold: true, fontSize: 16, alignment: 'center' },
                { text: 'COMPROBANTE DE FACTURACIÓN', fontSize: 11, alignment: 'center', margin: [0, 4, 0, 0] },
              ],
              margin: [0, 8, 0, 8],
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 12],
    },
    ...logoBlock(config, 56),
    ...timbradoBlock(boleta, config),
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'Cliente', bold: true, color: config.color_secundario },
            { text: boleta.cliente.nombre },
            { text: boleta.cliente.direccion, fontSize: 10 },
            { text: `CI: ${boleta.cliente.cedula || '-'}`, fontSize: 10 },
          ],
        },
        {
          width: '*',
          stack: [
            { text: 'Junta', bold: true, color: config.color_secundario },
            { text: config.direccion || '-', fontSize: 10 },
            { text: config.telefono || '-', fontSize: 10 },
            { text: config.email || '-', fontSize: 10 },
          ],
        },
      ],
      margin: [0, 0, 0, 12],
    },
    {
      text: `Emisión: ${boleta.emision.toLocaleDateString('es-PY')}     Vencimiento: ${boleta.vencimiento.toLocaleDateString('es-PY')}`,
      margin: [0, 0, 0, 10],
    },
    {
      table: {
        widths: ['*', '*', '*'],
        headerRows: 1,
        body: [
          [
            { text: 'Concepto / Período', bold: true, fillColor: '#EEEEEE' },
            { text: 'Consumo', bold: true, fillColor: '#EEEEEE' },
            { text: 'Importe', bold: true, fillColor: '#EEEEEE' },
          ],
          ...boleta.lineas.map((linea) => [
            `Servicio de agua — ${linea.periodo}`,
            `${linea.consumo} m³`,
            `${linea.monto} Gs`,
          ]),
          [
            { text: 'TOTAL A PAGAR', bold: true, colSpan: 2 },
            {},
            { text: `${total} Gs`, bold: true },
          ],
        ],
      },
    },
    {
      text: config.pie_boleta || '',
      alignment: 'center',
      margin: [0, 20, 0, 0],
      italics: true,
      fontSize: 10,
    },
  ];
};

/** Formato mínimo pensado para imprimir varias boletas en una hoja A4/oficio y cortar. */
const buildBasica = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  const total = boleta.lineas.reduce((sum, linea) => sum + Number(linea.monto), 0);
  const periodos = boleta.lineas.map((l) => l.periodo).join(', ');
  const consumo = boleta.lineas.reduce((sum, l) => sum + Number(l.consumo || 0), 0);

  return [
    {
      table: {
        widths: ['*'],
        body: [
          [
            {
              border: [true, true, true, true],
              stack: [
                {
                  text: config.nombre,
                  bold: true,
                  fontSize: 10,
                  color: config.color_primario,
                  alignment: 'center',
                },
                {
                  text: 'BOLETA DE AGUA',
                  fontSize: 9,
                  bold: true,
                  alignment: 'center',
                  margin: [0, 1, 0, 2],
                },
                ...(boleta.nroBoleta
                  ? [
                      {
                        text: `N° ${boleta.nroBoleta}`,
                        fontSize: 8,
                        alignment: 'center' as const,
                        margin: [0, 0, 0, 3] as [number, number, number, number],
                      },
                    ]
                  : []),
                {
                  text: boleta.cliente.nombre,
                  bold: true,
                  fontSize: 10,
                  margin: [0, 0, 0, 1],
                },
                {
                  text: `CI ${boleta.cliente.cedula || '-'}  ·  ${boleta.cliente.direccion}`,
                  fontSize: 8,
                  margin: [0, 0, 0, 3],
                },
                {
                  columns: [
                    {
                      text: `Período: ${periodos}`,
                      fontSize: 8,
                      width: '*',
                    },
                    {
                      text: `${consumo} m³`,
                      fontSize: 8,
                      width: 'auto',
                      alignment: 'right',
                    },
                  ],
                  margin: [0, 0, 0, 2],
                },
                {
                  columns: [
                    {
                      text: `Emite ${boleta.emision.toLocaleDateString('es-PY')}  ·  Vence ${boleta.vencimiento.toLocaleDateString('es-PY')}`,
                      fontSize: 8,
                      width: '*',
                    },
                    {
                      text: `${Number(total).toLocaleString('es-PY')} Gs`,
                      bold: true,
                      fontSize: 11,
                      width: 'auto',
                      alignment: 'right',
                      color: config.color_primario,
                    },
                  ],
                },
                ...(config.mostrar_timbrado
                  ? [
                      {
                        text: `RUC ${config.ruc || '-'} · Timbrado ${config.timbrado || '-'}`,
                        fontSize: 7,
                        margin: [0, 3, 0, 0] as [number, number, number, number],
                      },
                    ]
                  : []),
                ...(config.pie_boleta
                  ? [
                      {
                        text: config.pie_boleta,
                        fontSize: 7,
                        alignment: 'center' as const,
                        margin: [0, 4, 0, 0] as [number, number, number, number],
                        color: '#555555',
                      },
                    ]
                  : []),
              ],
              margin: [6, 6, 6, 6],
            },
          ],
        ],
      },
      layout: {
        hLineWidth: () => 0.7,
        vLineWidth: () => 0.7,
        hLineColor: () => '#999999',
        vLineColor: () => '#999999',
      },
    },
  ];
};

const buildBoletaContent = (boleta: BoletaPdfData, config: JuntaPdfConfig): Content[] => {
  const plantilla = (config.plantilla_boleta || 'clasica').toLowerCase();
  if (plantilla === 'basica') return buildBasica(boleta, config);
  if (plantilla === 'compacta') return buildCompacta(boleta, config);
  if (plantilla === 'formal') return buildFormal(boleta, config);
  return buildClasica(boleta, config);
};

const emptyBasicaSlot = (): Content => ({
  text: '',
  margin: [0, 0, 0, 0],
});

const buildBasicaPages = (boletas: BoletaPdfData[], config: JuntaPdfConfig): Content[] => {
  const perPage = normalizeBoletasPorPagina(config.boletas_por_pagina);
  const margen = Math.max(12, Math.min(Number(config.margen_mm || 20), 40));
  const usable = contentWidthPt(config.papel_boleta, margen);
  const content: Content[] = [];

  for (let i = 0; i < boletas.length; i += perPage) {
    const chunk = boletas.slice(i, i + perPage);
    if (perPage === 2) {
      const stack: Content[] = [];
      chunk.forEach((boleta, idx) => {
        stack.push(...buildBasica(boleta, config));
        if (idx < chunk.length - 1) {
          stack.push(dashedCutLine(usable));
        }
      });
      content.push({ stack });
    } else {
      const cells = [0, 1, 2, 3].map((slot) => {
        const boleta = chunk[slot];
        if (!boleta) return emptyBasicaSlot();
        return { stack: buildBasica(boleta, config) };
      });
      content.push({
        table: {
          widths: ['*', '*'],
          body: [
            [cells[0], cells[1]],
            [cells[2], cells[3]],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.6),
          vLineWidth: (i, node) =>
            i === 0 || i === (node.table.widths?.length || 0) ? 0 : 0.6,
          hLineColor: () => '#aaaaaa',
          vLineColor: () => '#aaaaaa',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      });
    }

    if (i + perPage < boletas.length) {
      content.push({ text: '', pageBreak: 'after' });
    }
  }

  return content;
};

const resolveConfig = async (draft?: Partial<JuntaPdfConfig> | Record<string, unknown>) => {
  const base = await getJuntaConfig();
  return sanitizeJuntaPdfConfig(base, draft);
};

export const createInvoiceFromBoletas = async (
  boletas: BoletaPdfData[],
  draft?: Partial<JuntaPdfConfig> | Record<string, unknown>
) => {
  if (!boletas.length) {
    throw new Error('No hay boletas para generar');
  }
  const config = await resolveConfig(draft);
  const styles = buildStyles(config);
  const plantilla = (config.plantilla_boleta || 'clasica').toLowerCase();
  const isBasica = plantilla === 'basica';

  let content: Content[];
  if (isBasica) {
    content = buildBasicaPages(boletas, config);
  } else {
    content = [];
    boletas.forEach((boleta, index) => {
      content.push(...buildBoletaContent(boleta, config));
      if (index < boletas.length - 1) {
        content.push({ text: '', pageBreak: 'after' });
      }
    });
  }

  const margenBase = Number(config.margen_mm || 40);
  const margen = isBasica
    ? Math.max(12, Math.min(margenBase, 28))
    : Math.max(20, Math.min(margenBase, 80));

  const docDefinition: TDocumentDefinitions = {
    content,
    styles,
    defaultStyle: { font: 'Roboto', fontSize: isBasica ? 9 : 11 },
    pageSize: resolvePageSize(config.papel_boleta),
    pageMargins: [margen, margen, margen, margen],
  };
  return pdfMake.createPdf(docDefinition);
};

export const createReciboFromData = async (recibo: ReciboPdfData) => {
  const config = await resolveConfig();
  const styles = buildStyles(config);
  const totalAbonado = recibo.lineas.reduce((sum, linea) => sum + Number(linea.montoPagado), 0);
  const totalSaldo = recibo.lineas.reduce((sum, linea) => sum + Number(linea.saldo), 0);

  const content: Content[] = [
    ...logoBlock(config),
    { text: 'RECIBO DE PAGO', style: 'header', alignment: 'center' },
    { text: config.nombre, style: 'subheader', alignment: 'center' },
    { text: `Fecha: ${recibo.fechaPago.toLocaleString('es-PY')}`, margin: [0, 10, 0, 4] },
    { text: `Cliente: ${recibo.cliente.nombre}`, margin: [0, 2, 0, 2] },
    { text: `Cédula: ${recibo.cliente.cedula || '-'}`, margin: [0, 2, 0, 10] },
    {
      table: {
        widths: ['*', '*', '*', '*'],
        body: [
          [
            { text: 'Factura', bold: true },
            { text: 'Período', bold: true },
            { text: 'Abonado', bold: true },
            { text: 'Saldo', bold: true },
          ],
          ...recibo.lineas.map((linea) => [
            `#${linea.facturaId}`,
            linea.periodo,
            `${linea.montoPagado} Gs`,
            `${linea.saldo} Gs`,
          ]),
          [
            { text: 'Totales', bold: true, colSpan: 2 },
            {},
            { text: `${totalAbonado} Gs`, bold: true },
            { text: `${totalSaldo} Gs`, bold: true },
          ],
        ],
      },
    },
    {
      text: config.pie_recibo || '',
      style: 'subheader',
      alignment: 'center',
      margin: [0, 16, 0, 16],
    },
  ];

  return pdfMake.createPdf({
    content,
    styles,
    defaultStyle: { font: 'Roboto' },
  });
};
