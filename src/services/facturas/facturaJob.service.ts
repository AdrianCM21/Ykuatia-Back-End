import { Between } from 'typeorm';
import { AppDataSource } from '../../config/db.config';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { Junta } from '../../models/junta';
import { getAnioMesActual } from '../../utils/anioMes';
import { addDias } from '../../utils/mora';
import { getJuntaId, runWithJunta, tryGetJuntaId } from '../../utils/juntaContext';
import { ConfiguracionJunta } from '../../models/configuracionJunta';

const ClienteRepositorio = AppDataSource.getRepository(Cliente);
const FacturaRepositorio = AppDataSource.getRepository(Factura);

const getRangoMesActual = (): { inicio: Date; fin: Date } => {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  return { inicio, fin };
};

const getDiasGracia = async (juntaId: number): Promise<number> => {
  const cfg = await AppDataSource.getRepository(ConfiguracionJunta).findOne({
    where: { id_junta: juntaId },
  });
  return Number(cfg?.dias_gracia || 14);
};

const clienteTieneFacturaDelMes = async (clienteId: number, anioMes: string): Promise<boolean> => {
  const juntaId = getJuntaId();
  const porMes = await FacturaRepositorio.findOne({
    where: {
      cliente: { id: clienteId },
      anio_mes: anioMes,
      delete: false,
      id_junta: juntaId,
    },
  });
  if (porMes) {
    return true;
  }

  const { inicio, fin } = getRangoMesActual();
  const existente = await FacturaRepositorio.findOne({
    where: {
      cliente: { id: clienteId },
      delete: false,
      id_junta: juntaId,
      Fecha_emicion: Between(inicio, fin),
    },
  });
  return Boolean(existente);
};

const generacionFacturaTarifaFija = async (
  cliente: Cliente,
  anioMes: string,
  diasGracia: number
): Promise<void> => {
  const juntaId = getJuntaId();
  const factura = new Factura();
  factura.cliente = cliente;
  factura.anio_mes = anioMes;
  factura.monto = cliente.tipoCliente.tarifa;
  factura.monto_pagado = 0;
  factura.estado = 'pendiente a pago';
  factura.fecha_vencimiento = addDias(new Date(), diasGracia);
  factura.id_junta = juntaId;
  await FacturaRepositorio.save(factura);
};

const generacionFacturaTarifaVariable = async (
  cliente: Cliente,
  anioMes: string,
  diasGracia: number
): Promise<void> => {
  const juntaId = getJuntaId();
  const factura = new Factura();
  factura.cliente = cliente;
  factura.anio_mes = anioMes;
  factura.monto = 0;
  factura.monto_pagado = 0;
  factura.estado = 'pendiente a carga de consumo';
  factura.fecha_vencimiento = addDias(new Date(), diasGracia);
  factura.id_junta = juntaId;
  await FacturaRepositorio.save(factura);
};

const controlClienteJunta = async (): Promise<{ generadas: number; omitidas: number }> => {
  const juntaId = getJuntaId();
  const anioMes = getAnioMesActual();
  const diasGracia = await getDiasGracia(juntaId);
  const clientes = await ClienteRepositorio.find({
    where: { delete: false, id_junta: juntaId },
    relations: ['tipoCliente'],
  });

  let generadas = 0;
  let omitidas = 0;

  for (const cliente of clientes) {
    const yaTieneFactura = await clienteTieneFacturaDelMes(cliente.id, anioMes);
    if (yaTieneFactura) {
      omitidas += 1;
      continue;
    }

    try {
      const tipoTarifa = cliente.tipoCliente.descripcion;
      if (tipoTarifa === 'Tarifa fija') {
        await generacionFacturaTarifaFija(cliente, anioMes, diasGracia);
      } else {
        await generacionFacturaTarifaVariable(cliente, anioMes, diasGracia);
      }
      generadas += 1;
    } catch (error) {
      omitidas += 1;
      console.error(`No se generó factura para cliente ${cliente.id}:`, error);
    }
  }

  return { generadas, omitidas };
};

const controlCliente = async (): Promise<{ generadas: number; omitidas: number }> => {
  if (tryGetJuntaId()) {
    return controlClienteJunta();
  }

  const juntas = await AppDataSource.getRepository(Junta).find({ where: { activa: true } });
  let generadas = 0;
  let omitidas = 0;
  for (const junta of juntas) {
    const result = await runWithJunta(junta.id, () => controlClienteJunta());
    generadas += result.generadas;
    omitidas += result.omitidas;
  }
  return { generadas, omitidas };
};

export { controlCliente };
