import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/db.config';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { PlanPago } from '../../models/planPago';
import { getJuntaId } from '../../utils/juntaContext';
import { registrarEvento } from '../auditoria/eventosAuditoria.service';

const ESTADOS_COBRABLES = ['pendiente a pago', 'parcialmente pagado'] as const;

const planRepo = () => AppDataSource.getRepository(PlanPago);
const clienteRepo = () => AppDataSource.getRepository(Cliente);
const facturaRepo = () => AppDataSource.getRepository(Factura);

export const listPlanes = async (params: { id_cliente?: number; estado?: string }) => {
  const juntaId = getJuntaId();
  const qb = planRepo()
    .createQueryBuilder('p')
    .leftJoinAndSelect('p.cliente', 'c')
    .leftJoinAndSelect('p.factura', 'f')
    .where('p.id_junta = :juntaId', { juntaId })
    .orderBy('p.created_at', 'DESC');

  if (params.id_cliente) {
    qb.andWhere('c.id = :cid', { cid: params.id_cliente });
  }
  if (params.estado) {
    qb.andWhere('p.estado = :estado', { estado: params.estado });
  }

  return qb.getMany();
};

export const createPlan = async (data: {
  id_cliente: number;
  id_factura?: number | null;
  monto_total: number;
  cuotas: number;
  notas?: string;
  idUsuario?: number;
}) => {
  const juntaId = getJuntaId();
  const cliente = await clienteRepo().findOne({
    where: { id: data.id_cliente, delete: false, id_junta: juntaId },
  });
  if (!cliente) throw new Error('Cliente no encontrado');

  let factura: Factura | null = null;
  if (data.id_factura) {
    factura = await facturaRepo().findOne({
      where: { id: data.id_factura, delete: false, id_junta: juntaId },
      relations: ['cliente'],
    });
    if (!factura) throw new Error('Factura no encontrada');
    if (factura.cliente?.id !== data.id_cliente) {
      throw new Error('La factura no pertenece al cliente');
    }
    if (!(ESTADOS_COBRABLES as readonly string[]).includes(factura.estado)) {
      throw new Error('La factura no está pendiente de cobro');
    }
  }

  const cuotas = Number(data.cuotas);
  const montoTotal = Number(data.monto_total);
  if (!(montoTotal > 0)) throw new Error('El monto total debe ser mayor a 0');
  if (!(cuotas > 0)) throw new Error('Las cuotas deben ser mayor a 0');

  const plan = new PlanPago();
  plan.cliente = cliente;
  plan.factura = factura;
  plan.monto_total = montoTotal;
  plan.cuotas = cuotas;
  plan.monto_cuota = Math.round((montoTotal / cuotas) * 100) / 100;
  plan.cuotas_pagadas = 0;
  plan.estado = 'activo';
  plan.notas = data.notas || null;
  plan.id_junta = juntaId;
  const saved = await planRepo().save(plan);

  try {
    await registrarEvento({
      idUsuario: data.idUsuario,
      accion: 'plan.crear',
      entidad: 'plan_pago',
      entidadId: saved.id,
      detalle: {
        idCliente: data.id_cliente,
        idFactura: data.id_factura || null,
        montoTotal,
        cuotas,
      },
    });
  } catch (error) {
    console.error('Error al registrar evento plan.crear:', error);
  }

  return saved;
};

/** Avanza 1 cuota del plan activo ligado al cobro (misma lógica que marcar_cuota). */
export const avanzarCuotaPorCobro = async (
  manager: EntityManager,
  opts: { idPlan?: number | null; idFactura: number; idCliente: number }
): Promise<PlanPago | null> => {
  const juntaId = getJuntaId();
  const repo = manager.getRepository(PlanPago);
  let plan: PlanPago | null = null;

  if (opts.idPlan) {
    plan = await repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .leftJoinAndSelect('p.factura', 'f')
      .where('p.id = :id', { id: opts.idPlan })
      .andWhere('p.id_junta = :juntaId', { juntaId })
      .andWhere('p.estado = :estado', { estado: 'activo' })
      .setLock('pessimistic_write')
      .getOne();
    if (!plan) throw new Error('Plan de pago no encontrado o no activo');
    if (plan.cliente?.id !== opts.idCliente) {
      throw new Error('El plan no pertenece al cliente de la factura');
    }
  } else {
    plan = await repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .leftJoinAndSelect('p.factura', 'f')
      .where('p.id_junta = :juntaId', { juntaId })
      .andWhere('p.estado = :estado', { estado: 'activo' })
      .andWhere('f.id = :idFactura', { idFactura: opts.idFactura })
      .setLock('pessimistic_write')
      .getOne();

    if (!plan) {
      const planesCliente = await repo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.cliente', 'c')
        .leftJoinAndSelect('p.factura', 'f')
        .where('p.id_junta = :juntaId', { juntaId })
        .andWhere('p.estado = :estado', { estado: 'activo' })
        .andWhere('c.id = :idCliente', { idCliente: opts.idCliente })
        .setLock('pessimistic_write')
        .getMany();
      if (planesCliente.length === 1) {
        plan = planesCliente[0];
      }
    }
  }

  if (!plan) return null;

  plan.cuotas_pagadas = Number(plan.cuotas_pagadas) + 1;
  if (plan.cuotas_pagadas >= plan.cuotas) {
    plan.estado = 'completado';
    plan.cuotas_pagadas = plan.cuotas;
  }
  return repo.save(plan);
};

/** Retrocede 1 cuota al revertir un abono ligado a un plan. */
export const retrocederCuotaPorReverso = async (
  manager: EntityManager,
  idPlan: number
): Promise<PlanPago | null> => {
  const juntaId = getJuntaId();
  const repo = manager.getRepository(PlanPago);
  const plan = await repo.findOne({
    where: { id: idPlan, id_junta: juntaId },
    lock: { mode: 'pessimistic_write' },
  });
  if (!plan) return null;

  const pagadas = Number(plan.cuotas_pagadas || 0);
  if (pagadas > 0) {
    plan.cuotas_pagadas = pagadas - 1;
  }
  if (plan.estado === 'completado') {
    plan.estado = 'activo';
  }
  return repo.save(plan);
};

export const updatePlan = async (
  id: number,
  data: { accion: 'marcar_cuota' | 'cancelar'; notas?: string; idUsuario?: number }
) => {
  const juntaId = getJuntaId();
  const plan = await planRepo().findOne({
    where: { id, id_junta: juntaId },
    relations: ['cliente', 'factura'],
  });
  if (!plan) throw new Error('Plan no encontrado');

  if (data.accion === 'cancelar') {
    plan.estado = 'cancelado';
  } else if (data.accion === 'marcar_cuota') {
    if (plan.estado !== 'activo') throw new Error('El plan no está activo');
    plan.cuotas_pagadas = Number(plan.cuotas_pagadas) + 1;
    if (plan.cuotas_pagadas >= plan.cuotas) {
      plan.estado = 'completado';
      plan.cuotas_pagadas = plan.cuotas;
    }
  }

  if (data.notas != null) plan.notas = data.notas;
  const saved = await planRepo().save(plan);

  try {
    await registrarEvento({
      idUsuario: data.idUsuario,
      accion: data.accion === 'cancelar' ? 'plan.cancelar' : 'plan.cuota',
      entidad: 'plan_pago',
      entidadId: saved.id,
      detalle: {
        cuotasPagadas: saved.cuotas_pagadas,
        estado: saved.estado,
      },
    });
  } catch (error) {
    console.error('Error al registrar evento plan:', error);
  }

  return saved;
};
