import { AppDataSource } from '../../config/db.config';
import { IDataPdf } from '../../interfaces/facturas/pdf';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { Transaccion } from '../../models/trasacciones';
import { formateoMes } from '../../utils/formateoFechas';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId } from '../../utils/juntaContext';
import {
  addDias,
  calcularRecargoMora,
  ESTADOS_COBRABLES,
  saldoFactura,
} from '../../utils/mora';
import { appendAuditoria, getAuditoriaId } from '../auditoria/auditoria.service';
import { registrarEvento } from '../auditoria/eventosAuditoria.service';
import { registrarLectura } from '../lecturas/lecturas.service';
import { assertPeriodoAbierto } from '../caja/periodoCaja.guard';
import { findTipoOperacion, TIPO_INGRESO } from '../transaciones/transaciones.service';
import { getJuntaConfig } from '../junta/junta.service';
import { avanzarCuotaPorCobro, retrocederCuotaPorReverso } from '../planes/planes.service';
import { PlanPago } from '../../models/planPago';

const RepositorioClientes = AppDataSource.getRepository(Cliente);
const RepositorioFacturas = AppDataSource.getRepository(Factura);

const getFacturas = async (params: {
  page?: string | number;
  limit?: string | number;
  desde?: string | number;
  q?: string;
}): Promise<{ resultado: Factura[]; total: number; page: number; limit: number }> => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = RepositorioFacturas.createQueryBuilder('f')
    .leftJoinAndSelect('f.cliente', 'cliente')
    .where('f.delete = :del', { del: false })
    .andWhere('f.id_junta = :juntaId', { juntaId });

  if (params.q) {
    qb.andWhere('(cliente.nombre LIKE :q OR cliente.cedula LIKE :q OR f.estado LIKE :q)', {
      q: `%${params.q}%`,
    });
  }

  qb.orderBy('f.Fecha_emicion', 'DESC').skip(skip).take(limit);
  const [resultado, total] = await qb.getManyAndCount();
  return { resultado, total, page, limit };
};

const completadoConsumoService = async (
  id: string,
  consumo: string,
  idUsuario?: number
): Promise<Factura | null> => {
  const juntaId = getJuntaId();
  const factura = await RepositorioFacturas.findOne({
    where: { id: Number(id), id_junta: juntaId },
    relations: ['cliente', 'cliente.tipoCliente'],
  });
  if (!factura) {
    return null;
  }
  if (factura.estado !== 'pendiente a carga de consumo') {
    throw new Error('La factura no está pendiente de carga de consumo');
  }
  const junta = await getJuntaConfig();
  factura.estado = 'pendiente a pago';
  factura.consumo = Number(consumo);
  factura.monto = Number(consumo) * factura.cliente.tipoCliente.tarifa;
  if (!factura.fecha_vencimiento) {
    factura.fecha_vencimiento = addDias(new Date(), Number(junta.dias_gracia || 14));
  }
  const saved = await RepositorioFacturas.save(factura);

  await registrarLectura({
    cliente: saved.cliente,
    factura: saved,
    consumo: Number(consumo),
    origen: 'oficina',
    idUsuario,
  });

  await registrarEvento({
    idUsuario,
    accion: 'factura.consumo',
    entidad: 'factura',
    entidadId: saved.id,
    detalle: { consumo: Number(consumo), monto: Number(saved.monto) },
  });

  return saved;
};

const filtrarClientesConFacturas = (clientes: Cliente[]) => {
  return clientes
    .filter(
      (cliente) =>
        cliente.factura &&
        cliente.factura.length > 0 &&
        cliente.factura.some((factura) =>
          (ESTADOS_COBRABLES as readonly string[]).includes(factura.estado)
        )
    )
    .map((cliente) => ({ cliente, facturas: cliente.factura }));
};

const filtrarFacturasPendientes = (clientesConFacturas: IDataPdf[]) => {
  return clientesConFacturas.map((cliente) => ({
    cliente: cliente.cliente,
    facturas: cliente.facturas.filter((factura) =>
      (ESTADOS_COBRABLES as readonly string[]).includes(factura.estado)
    ),
  }));
};

const obtenerClientes = async (): Promise<Cliente[] | null> => {
  const juntaId = getJuntaId();
  const cliente = await RepositorioClientes.find({
    relations: ['tipoCliente', 'factura'],
    where: { delete: false, id_junta: juntaId },
  });
  return cliente ?? null;
};

const obtenerCliente = async (id: string): Promise<Cliente[] | null> => {
  const juntaId = getJuntaId();
  const cliente = await RepositorioClientes.findOne({
    where: { id: Number(id), delete: false, id_junta: juntaId },
    relations: ['tipoCliente', 'factura'],
  });
  if (!cliente) {
    return null;
  }
  return [cliente];
};

export type PagoFacturaInput = {
  idFactura: number;
  monto?: number;
  incluirMora?: boolean;
  idPlan?: number | null;
  idUsuario?: number;
};

const pagoFactura = async (input: PagoFacturaInput): Promise<Factura> => {
  const { idFactura, monto, incluirMora, idPlan, idUsuario } = input;
  await assertPeriodoAbierto(new Date());
  const juntaId = getJuntaId();
  const junta = await getJuntaConfig();
  const tipoIngreso = await findTipoOperacion(TIPO_INGRESO);

  // Side-effects (auditoría / eventos) van DESPUÉS del commit: un FOR UPDATE con
  // join a cliente.auditoria + UPDATE en otra conexión provocaba lock wait timeout.
  const paid = await AppDataSource.transaction(async (manager) => {
    const facturaRepo = manager.getRepository(Factura);
    const transaccionRepo = manager.getRepository(Transaccion);

    const factura = await facturaRepo.findOne({
      where: { id: idFactura, delete: false, id_junta: juntaId },
      relations: ['cliente'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!factura) {
      throw new Error('Factura no encontrada');
    }
    if (factura.estado === 'pagado') {
      throw new Error('La factura ya está pagada');
    }
    if (!(ESTADOS_COBRABLES as readonly string[]).includes(factura.estado)) {
      throw new Error('La factura no está pendiente a pago');
    }

    const saldo = saldoFactura(Number(factura.monto), Number(factura.monto_pagado || 0));
    if (saldo <= 0) {
      throw new Error('La factura no tiene saldo pendiente');
    }

    let recargo = 0;
    if (incluirMora) {
      recargo = calcularRecargoMora({
        saldo,
        fechaVencimiento: factura.fecha_vencimiento,
        moraPct: Number(junta.mora_pct || 0),
      });
    }

    const abonoSolicitado = monto != null ? Number(monto) : saldo + recargo;
    if (abonoSolicitado <= 0) {
      throw new Error('El monto a pagar debe ser mayor a 0');
    }

    const maxPago = saldo + recargo;
    if (abonoSolicitado > maxPago + 0.009) {
      throw new Error(`El monto supera el saldo (${maxPago})`);
    }

    const abonoAFactura = Math.min(abonoSolicitado, saldo);
    const abonoMora = Math.max(0, abonoSolicitado - abonoAFactura);

    factura.monto_pagado = Number(factura.monto_pagado || 0) + abonoAFactura;
    const nuevoSaldo = saldoFactura(Number(factura.monto), Number(factura.monto_pagado));
    factura.estado = nuevoSaldo <= 0.009 ? 'pagado' : 'parcialmente pagado';
    if (factura.estado === 'pagado') {
      factura.monto_pagado = Number(factura.monto);
    }

    const result = await facturaRepo.save(factura);

    let planAvanzado: PlanPago | null = null;
    if (abonoAFactura > 0) {
      planAvanzado = await avanzarCuotaPorCobro(manager, {
        idPlan: idPlan ?? null,
        idFactura: result.id,
        idCliente: result.cliente.id,
      });
    }

    const movimiento = new Transaccion();
    movimiento.monto = abonoSolicitado;
    movimiento.motivo = `Pago Factura. Usuario - ${result.cliente.nombre}`.slice(0, 80);
    movimiento.tipo_ingreso = tipoIngreso;
    movimiento.factura = result;
    movimiento.plan = planAvanzado;
    movimiento.id_junta = juntaId;
    const movimientoGuardado = await transaccionRepo.save(movimiento);

    return {
      result,
      abonoSolicitado,
      abonoAFactura,
      abonoMora,
      idPlan: planAvanzado?.id ?? null,
      idTransaccion: movimientoGuardado.id,
      auditMsg:
        `Abono factura ${formateoMes(result.Fecha_emicion)}: ${abonoAFactura} Gs` +
        (abonoMora ? ` (+ mora ${abonoMora})` : ''),
    };
  });

  const { result, abonoSolicitado, abonoAFactura, abonoMora, idPlan: planId, idTransaccion, auditMsg } =
    paid;

  if (result.cliente?.id) {
    try {
      const auditoriaId = await getAuditoriaId(result.cliente.id);
      if (auditoriaId) {
        await appendAuditoria(auditoriaId, auditMsg);
      }
    } catch (error) {
      console.error('Error al actualizar auditoria tras pago (pago ya confirmado):', error);
    }
  }

  try {
    await registrarEvento({
      idUsuario,
      accion: 'factura.pago',
      entidad: 'factura',
      entidadId: result.id,
      detalle: {
        monto: abonoSolicitado,
        abonoFactura: abonoAFactura,
        mora: abonoMora,
        saldoRestante: saldoFactura(Number(result.monto), Number(result.monto_pagado)),
        estado: result.estado,
        clienteId: result.cliente?.id,
        idPlan: planId,
        idTransaccion,
      },
    });
    if (planId) {
      await registrarEvento({
        idUsuario,
        accion: 'plan.cuota',
        entidad: 'plan_pago',
        entidadId: planId,
        detalle: { idFactura: result.id, idTransaccion, origen: 'cobro' },
      });
    }
  } catch (error) {
    console.error('Error al registrar evento tras pago (pago ya confirmado):', error);
  }

  return result;
};

const revertirAbono = async (idTransaccion: number, idUsuario?: number): Promise<Transaccion> => {
  await assertPeriodoAbierto(new Date());
  const juntaId = getJuntaId();

  const reverted = await AppDataSource.transaction(async (manager) => {
    const facturaRepo = manager.getRepository(Factura);
    const transaccionRepo = manager.getRepository(Transaccion);

    const tx = await transaccionRepo.findOne({
      where: { id: idTransaccion, id_junta: juntaId },
      relations: ['factura', 'factura.cliente', 'plan', 'tipo_ingreso'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!tx) throw new Error('Movimiento no encontrado');
    if (tx.delete) throw new Error('El abono ya fue revertido');
    if (!tx.factura) throw new Error('El movimiento no está ligado a una factura');
    if (Number(tx.tipo_ingreso?.id) !== TIPO_INGRESO) {
      throw new Error('Solo se pueden revertir ingresos de cobro');
    }

    const factura = await facturaRepo.findOne({
      where: { id: tx.factura.id, delete: false, id_junta: juntaId },
      relations: ['cliente'],
      lock: { mode: 'pessimistic_write' },
    });
    if (!factura) throw new Error('Factura no encontrada');

    const montoTx = Number(tx.monto);
    const montoPagadoActual = Number(factura.monto_pagado || 0);
    const abonoFacturaRevertido = Math.min(montoTx, montoPagadoActual);

    factura.monto_pagado = Math.max(0, montoPagadoActual - abonoFacturaRevertido);
    if (factura.monto_pagado <= 0.009) {
      factura.monto_pagado = 0;
      factura.estado = 'pendiente a pago';
    } else {
      factura.estado = 'parcialmente pagado';
    }
    await facturaRepo.save(factura);

    tx.delete = true;
    const txSaved = await transaccionRepo.save(tx);

    let planId: number | null = tx.plan?.id ?? null;
    if (planId) {
      await retrocederCuotaPorReverso(manager, planId);
    }

    return {
      txSaved,
      factura,
      abonoFacturaRevertido,
      planId,
    };
  });

  const { txSaved, factura, abonoFacturaRevertido, planId } = reverted;

  if (factura.cliente?.id) {
    try {
      const auditoriaId = await getAuditoriaId(factura.cliente.id);
      if (auditoriaId) {
        await appendAuditoria(
          auditoriaId,
          `Reverso abono factura ${formateoMes(factura.Fecha_emicion)}: ${abonoFacturaRevertido} Gs`
        );
      }
    } catch (error) {
      console.error('Error al actualizar auditoria tras reverso:', error);
    }
  }

  try {
    await registrarEvento({
      idUsuario,
      accion: 'factura.pago_revertido',
      entidad: 'factura',
      entidadId: factura.id,
      detalle: {
        idTransaccion: txSaved.id,
        abonoFactura: abonoFacturaRevertido,
        montoMovimiento: Number(txSaved.monto),
        montoPagado: Number(factura.monto_pagado),
        estado: factura.estado,
        idPlan: planId,
        clienteId: factura.cliente?.id,
      },
    });
  } catch (error) {
    console.error('Error al registrar evento tras reverso:', error);
  }

  return txSaved;
};

const listMovimientosPago = async (params: {
  id_cliente?: number;
  limit?: number;
}): Promise<Transaccion[]> => {
  const juntaId = getJuntaId();
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
  const qb = AppDataSource.getRepository(Transaccion)
    .createQueryBuilder('t')
    .leftJoinAndSelect('t.factura', 'f')
    .leftJoinAndSelect('f.cliente', 'c')
    .leftJoinAndSelect('t.plan', 'p')
    .leftJoinAndSelect('t.tipo_ingreso', 'ti')
    .where('t.id_junta = :juntaId', { juntaId })
    .andWhere('t.delete = :del', { del: false })
    .andWhere('f.id IS NOT NULL')
    .andWhere('ti.id = :tipo', { tipo: TIPO_INGRESO })
    .orderBy('t.fecha', 'DESC')
    .take(limit);

  if (params.id_cliente) {
    qb.andWhere('c.id = :cid', { cid: params.id_cliente });
  }

  return qb.getMany();
};

const getFacturasByIds = async (ids: number[]): Promise<Factura[]> => {
  if (!ids.length) return [];
  const juntaId = getJuntaId();
  return RepositorioFacturas.createQueryBuilder('f')
    .leftJoinAndSelect('f.cliente', 'cliente')
    .where('f.id IN (:...ids)', { ids })
    .andWhere('f.id_junta = :juntaId', { juntaId })
    .getMany();
};

const asignarNroBoletaSiFalta = async (factura: Factura, nro: string): Promise<Factura> => {
  if (factura.nro_boleta) return factura;
  factura.nro_boleta = nro;
  return RepositorioFacturas.save(factura);
};

export {
  getFacturas,
  obtenerClientes,
  filtrarClientesConFacturas,
  filtrarFacturasPendientes,
  obtenerCliente,
  completadoConsumoService,
  pagoFactura,
  revertirAbono,
  listMovimientosPago,
  getFacturasByIds,
  asignarNroBoletaSiFalta,
};
