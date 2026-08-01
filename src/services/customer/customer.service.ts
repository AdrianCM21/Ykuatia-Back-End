import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
import { AppDataSource } from '../../config/db.config';
import { Cliente, TipoCliente } from '../../models/clientes';
import { Auditoria } from '../../models/auditoria';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId } from '../../utils/juntaContext';
import { calcularRecargoMora, ESTADOS_COBRABLES, saldoFactura } from '../../utils/mora';
import { getJuntaConfig } from '../junta/junta.service';

const RepositorioClientes = AppDataSource.getRepository(Cliente);
const RepositorioAuditorias = AppDataSource.getRepository(Auditoria);
const RepositorioTipoClientes = AppDataSource.getRepository(TipoCliente);

type ListParams = {
  page?: string | number;
  limit?: string | number;
  desde?: string | number;
  q?: string;
};

const estadosCobrablesSql = ESTADOS_COBRABLES.map((e) => `'${e}'`).join(', ');

const getClientes = async (
  params: ListParams
): Promise<{ resultado: Cliente[]; total: number; page: number; limit: number }> => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = RepositorioClientes.createQueryBuilder('c')
    .leftJoinAndSelect('c.tipoCliente', 'tipoCliente')
    .leftJoinAndSelect('c.auditoria', 'auditoria')
    .leftJoinAndSelect('c.factura', 'factura')
    .where('c.delete = :del', { del: false })
    .andWhere('c.id_junta = :juntaId', { juntaId });

  if (params.q) {
    qb.andWhere('(c.nombre LIKE :q OR c.cedula LIKE :q OR c.telefono LIKE :q)', {
      q: `%${params.q}%`,
    });
  }

  qb.orderBy('c.nombre', 'ASC').skip(skip).take(limit);
  const [resultado, total] = await qb.getManyAndCount();
  return { resultado, total, page, limit };
};

const getClientesConFactura = async (
  params: ListParams
): Promise<{ resultado: Cliente[]; total: number; page: number; limit: number }> => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = RepositorioClientes.createQueryBuilder('c')
    .leftJoinAndSelect(
      'c.factura',
      'factura',
      `factura.estado IN (${estadosCobrablesSql}) AND factura.delete = false`
    )
    .leftJoinAndSelect('c.tipoCliente', 'tipoCliente')
    .where('c.delete = :del', { del: false })
    .andWhere('c.id_junta = :juntaId', { juntaId })
    .andWhere(
      `EXISTS (
        SELECT 1 FROM facturas f
        WHERE f.id_cliente = c.id
          AND f.estado IN (${estadosCobrablesSql})
          AND f.delete = false
          AND f.id_junta = :juntaId
      )`
    );

  if (params.q) {
    qb.andWhere('(c.nombre LIKE :q OR c.cedula LIKE :q)', { q: `%${params.q}%` });
  }

  qb.orderBy('c.nombre', 'ASC').skip(skip).take(limit);
  const [resultado, total] = await qb.getManyAndCount();
  const junta = await getJuntaConfig();
  const moraPct = Number(junta.mora_pct || 0);

  for (const cliente of resultado) {
    for (const factura of cliente.factura || []) {
      const saldo = saldoFactura(Number(factura.monto), Number(factura.monto_pagado || 0));
      const recargo = calcularRecargoMora({
        saldo,
        fechaVencimiento: factura.fecha_vencimiento,
        moraPct,
      });
      Object.assign(factura, { saldo, recargo });
    }
  }

  return { resultado, total, page, limit };
};

const addCliente = async (data: IAddUpdateCustomer, idAuditoria: number): Promise<Cliente> => {
  const juntaId = getJuntaId();
  const tipoCliente = await findTipoCliente(data.tipoCliente);
  const auditoria = await findAuditoria(idAuditoria);
  const addClienteEntity = new Cliente();
  addClienteEntity.cedula = data.cedula;
  addClienteEntity.nombre = data.nombre;
  addClienteEntity.direccion = data.direccion;
  addClienteEntity.telefono = data.telefono;
  addClienteEntity.auditoria = auditoria;
  addClienteEntity.tipoCliente = tipoCliente;
  addClienteEntity.locacion = data.locacion;
  addClienteEntity.nro_medidor = data.nro_medidor?.trim() || null;
  addClienteEntity.id_junta = juntaId;
  return AppDataSource.manager.save(addClienteEntity);
};

const updateCliente = async (id: string, data: IAddUpdateCustomer) => {
  const juntaId = getJuntaId();
  const clienteUpdate = await RepositorioClientes.findOne({
    where: { id: Number(id), id_junta: juntaId },
  });
  const tipoCliente = await RepositorioTipoClientes.findOne({
    where: { id_tipo: Number(data.tipoCliente), id_junta: juntaId },
  });
  if (!tipoCliente) {
    throw new Error('El tipo de cliente no existe');
  }
  if (!clienteUpdate) {
    throw new Error('Cliente no encontrado');
  }
  clienteUpdate.cedula = data.cedula;
  clienteUpdate.nombre = data.nombre;
  clienteUpdate.direccion = data.direccion;
  clienteUpdate.telefono = data.telefono;
  clienteUpdate.tipoCliente = tipoCliente;
  clienteUpdate.locacion = data.locacion;
  if (data.nro_medidor !== undefined) {
    clienteUpdate.nro_medidor = data.nro_medidor?.trim() || null;
  }
  return AppDataSource.manager.save(clienteUpdate);
};

const deleteCliente = async (id: string) => {
  const juntaId = getJuntaId();
  const clienteDelete = await RepositorioClientes.findOne({
    where: { id: Number(id), id_junta: juntaId },
  });
  if (!clienteDelete) {
    throw new Error('Cliente no encontrado');
  }
  clienteDelete.delete = true;
  await AppDataSource.manager.save(clienteDelete);
  return { success: 'Eliminado correctamente' };
};

const getCustomerTypes = async () => {
  const juntaId = getJuntaId();
  return RepositorioTipoClientes.find({ where: { id_junta: juntaId } });
};

const findTipoCliente = async (id: number) => {
  const juntaId = getJuntaId();
  const tipoCliente = await RepositorioTipoClientes.findOne({
    where: { id_tipo: id, id_junta: juntaId },
  });
  if (!tipoCliente) {
    throw new Error('El tipo de cliente no existe');
  }
  return tipoCliente;
};

const findAuditoria = async (id: number) => {
  const auditoria = await RepositorioAuditorias.findOneBy({ id });
  if (!auditoria) {
    throw new Error('La auditoria no existe');
  }
  return auditoria;
};

export {
  getClientesConFactura,
  addCliente,
  getClientes,
  updateCliente,
  deleteCliente,
  getCustomerTypes,
};
