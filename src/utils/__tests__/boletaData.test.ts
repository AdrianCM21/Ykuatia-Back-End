import {
  buildPreviewBoleta,
  sanitizeJuntaPdfConfig,
  toBoletaFromClienteFacturas,
  toReciboFromFacturas,
} from '../boletaData';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { ConfiguracionJunta } from '../../models/configuracionJunta';

describe('boletaData', () => {
  const baseConfig = {
    nombre: 'Ykuatia',
    slogan: 'Agua',
    direccion: 'Calle 1',
    telefono: '123',
    email: 'a@b.com',
    pie_boleta: 'pie',
    pie_recibo: 'gracias',
    color_primario: '#0B6E6E',
    color_secundario: '#1F4E79',
    logo_principal: null,
    logo_secundario: null,
    margen_mm: 40,
    mostrar_timbrado: false,
    timbrado: '',
    ruc: '',
    plantilla_boleta: 'clasica',
  } as ConfiguracionJunta;

  it('arma boleta con vencimiento de DB', () => {
    const cliente = { nombre: 'Juan', direccion: 'X', cedula: '1' } as Cliente;
    const factura = {
      Fecha_emicion: new Date('2026-08-01'),
      fecha_vencimiento: new Date('2026-08-15'),
      anio_mes: '2026-08',
      consumo: 10,
      monto: 25000,
      nro_boleta: '000001',
    } as Factura;

    const boleta = toBoletaFromClienteFacturas(cliente, [factura]);
    expect(boleta?.vencimiento.toISOString()).toContain('2026-08-15');
    expect(boleta?.lineas[0].monto).toBe(25000);
  });

  it('recibo incluye abonado y saldo', () => {
    const recibo = toReciboFromFacturas([
      {
        id: 9,
        anio_mes: '2026-08',
        monto: 30000,
        monto_pagado: 10000,
        cliente: { nombre: 'Ana', direccion: 'Y', cedula: '2' },
      } as Factura,
    ]);

    expect(recibo?.lineas[0]).toMatchObject({
      facturaId: 9,
      monto: 30000,
      montoPagado: 10000,
      saldo: 20000,
    });
  });

  it('preview boleta tiene datos de ejemplo', () => {
    const preview = buildPreviewBoleta();
    expect(preview.cliente.nombre).toContain('ejemplo');
    expect(preview.lineas.length).toBe(1);
  });

  it('sanitize JuntaPdfConfig aplica draft y valida colores', () => {
    const cfg = sanitizeJuntaPdfConfig(baseConfig, {
      nombre: 'Nueva',
      color_primario: 'no-hex',
      plantilla_boleta: 'formal',
    });
    expect(cfg.nombre).toBe('Nueva');
    expect(cfg.color_primario).toBe('#0B6E6E');
    expect(cfg.plantilla_boleta).toBe('formal');
  });
});
