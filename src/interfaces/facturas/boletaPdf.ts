export type BoletaClientePdf = {
  nombre: string;
  direccion: string;
  cedula?: string;
};

export type BoletaLineaPdf = {
  periodo: string;
  consumo: number;
  monto: number;
};

export type BoletaPdfData = {
  cliente: BoletaClientePdf;
  emision: Date;
  vencimiento: Date;
  lineas: BoletaLineaPdf[];
  nroBoleta?: string | null;
};

export type ReciboLineaPdf = {
  facturaId: number;
  periodo: string;
  monto: number;
  montoPagado: number;
  saldo: number;
};

export type ReciboPdfData = {
  cliente: BoletaClientePdf;
  fechaPago: Date;
  lineas: ReciboLineaPdf[];
};

export type JuntaPdfConfig = {
  nombre: string;
  slogan: string;
  direccion: string;
  telefono: string;
  email: string;
  pie_boleta: string;
  pie_recibo: string;
  color_primario: string;
  color_secundario: string;
  logo_principal?: string | null;
  logo_secundario?: string | null;
  margen_mm?: number;
  mostrar_timbrado?: boolean;
  timbrado?: string;
  ruc?: string;
  plantilla_boleta?: string;
  papel_boleta?: string;
  boletas_por_pagina?: number;
};
