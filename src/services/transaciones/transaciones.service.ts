import { AppDataSource } from '../../config/db.config';
import { TipoIngreso, Transaccion } from '../../models/trasacciones';
import { Factura } from '../../models/facturas';
import IAddTransacion from '../../interfaces/transaciones/IAddTransaciones';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId } from '../../utils/juntaContext';
import { assertPeriodoAbierto } from '../caja/periodoCaja.guard';
import { registrarEvento } from '../auditoria/eventosAuditoria.service';

const RepositorioTransaciones = AppDataSource.getRepository(Transaccion);
const RepositorioOperaciones = AppDataSource.getRepository(TipoIngreso);
const RepositorioFacturas = AppDataSource.getRepository(Factura);

const TIPO_EGRESO = 1;
const TIPO_INGRESO = 2;

export const getTransaciones = async (params: {
  page?: string | number;
  limit?: string | number;
  desde?: string | number;
  q?: string;
  desdeFecha?: string;
  hastaFecha?: string;
}): Promise<{ resultado: Transaccion[]; total: number; page: number; limit: number }> => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = RepositorioTransaciones.createQueryBuilder('t')
    .leftJoinAndSelect('t.tipo_ingreso', 'tipo')
    .leftJoinAndSelect('t.factura', 'factura')
    .where('t.delete = :del', { del: false })
    .andWhere('t.id_junta = :juntaId', { juntaId });

  if (params.q) {
    qb.andWhere('t.motivo LIKE :q', { q: `%${params.q}%` });
  }
  if (params.desdeFecha && params.hastaFecha) {
    qb.andWhere('t.fecha BETWEEN :desde AND :hasta', {
      desde: new Date(`${params.desdeFecha}T00:00:00`),
      hasta: new Date(`${params.hastaFecha}T23:59:59`),
    });
  }

  qb.orderBy('t.fecha', 'DESC').skip(skip).take(limit);
  const [resultado, total] = await qb.getManyAndCount();
  return { resultado, total, page, limit };
};

export const getCajaResumen = async (params: {
  desdeFecha?: string;
  hastaFecha?: string;
}): Promise<{ ingresos: number; egresos: number; saldo: number }> => {
  const juntaId = getJuntaId();
  const qb = RepositorioTransaciones.createQueryBuilder('t')
    .leftJoin('t.tipo_ingreso', 'tipo')
    .select('tipo.id', 'tipoId')
    .addSelect('SUM(t.monto)', 'total')
    .where('t.delete = :del', { del: false })
    .andWhere('t.id_junta = :juntaId', { juntaId })
    .groupBy('tipo.id');

  if (params.desdeFecha && params.hastaFecha) {
    qb.andWhere('t.fecha BETWEEN :desde AND :hasta', {
      desde: new Date(`${params.desdeFecha}T00:00:00`),
      hasta: new Date(`${params.hastaFecha}T23:59:59`),
    });
  }

  const rows = await qb.getRawMany<{ tipoId: string; total: string }>();
  let ingresos = 0;
  let egresos = 0;
  for (const row of rows) {
    const tipoId = Number(row.tipoId);
    const total = Number(row.total || 0);
    if (tipoId === TIPO_INGRESO) ingresos = total;
    if (tipoId === TIPO_EGRESO) egresos = total;
  }
  return { ingresos, egresos, saldo: ingresos - egresos };
};

export const addTransaciones = async (
  data: IAddTransacion,
  idUsuario?: number
): Promise<Transaccion> => {
  await assertPeriodoAbierto(new Date());

  const juntaId = getJuntaId();
  const tipo = await findTipoOperacion(Number(data.tipo_transacion));
  const addTransacion = new Transaccion();
  addTransacion.monto = Number(data.monto);
  addTransacion.motivo = data.motivo;
  addTransacion.tipo_ingreso = tipo;
  addTransacion.factura = null;
  addTransacion.id_junta = juntaId;

  if (data.id_factura) {
    const factura = await RepositorioFacturas.findOne({
      where: { id: data.id_factura, id_junta: juntaId },
    });
    if (!factura) {
      throw new Error('La factura no existe');
    }
    addTransacion.factura = factura;
  }

  const saved = await AppDataSource.manager.save(addTransacion);

  await registrarEvento({
    idUsuario,
    accion: 'caja.movimiento',
    entidad: 'transaccion',
    entidadId: saved.id,
    detalle: {
      monto: Number(saved.monto),
      motivo: saved.motivo,
      tipo: Number(data.tipo_transacion),
    },
  });

  return saved;
};

export const findTipoOperacion = async (id: number) => {
  const tipo = await RepositorioOperaciones.findOneBy({ id });
  if (!tipo) {
    throw new Error('El tipo de transacion no existe');
  }
  return tipo;
};

export { TIPO_EGRESO, TIPO_INGRESO };
