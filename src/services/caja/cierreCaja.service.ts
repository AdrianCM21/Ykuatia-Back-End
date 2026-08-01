import { AppDataSource } from '../../config/db.config';
import { CierreCaja } from '../../models/cierreCaja';
import { Usuario } from '../../models/usuarios';
import { Transaccion } from '../../models/trasacciones';
import { getCajaResumen } from '../transaciones/transaciones.service';
import { resolvePagination } from '../../utils/pagination';
import { toCsv } from '../../utils/csv';
import { getJuntaId } from '../../utils/juntaContext';
import { registrarEvento } from '../auditoria/eventosAuditoria.service';

export { assertPeriodoAbierto } from './periodoCaja.guard';

const repo = () => AppDataSource.getRepository(CierreCaja);

const rangeForPeriodo = (tipo: 'dia' | 'mes', periodo: string) => {
  if (tipo === 'dia') {
    return { desdeFecha: periodo, hastaFecha: periodo };
  }
  const [y, m] = periodo.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    desdeFecha: `${periodo}-01`,
    hastaFecha: `${periodo}-${String(lastDay).padStart(2, '0')}`,
  };
};

export const crearCierre = async (input: {
  tipo: 'dia' | 'mes';
  periodo: string;
  notas?: string;
  idUsuario?: number;
}) => {
  if (input.tipo === 'dia' && !/^\d{4}-\d{2}-\d{2}$/.test(input.periodo)) {
    throw new Error('Período día inválido (YYYY-MM-DD)');
  }
  if (input.tipo === 'mes' && !/^\d{4}-\d{2}$/.test(input.periodo)) {
    throw new Error('Período mes inválido (YYYY-MM)');
  }

  const juntaId = getJuntaId();
  const existing = await repo().findOne({
    where: { periodo_tipo: input.tipo, periodo: input.periodo, id_junta: juntaId },
  });
  if (existing?.activo) {
    throw new Error('Ese período ya está cerrado');
  }

  const range = rangeForPeriodo(input.tipo, input.periodo);
  const resumen = await getCajaResumen(range);

  const cierre = existing || new CierreCaja();
  cierre.periodo_tipo = input.tipo;
  cierre.periodo = input.periodo;
  cierre.ingresos = resumen.ingresos;
  cierre.egresos = resumen.egresos;
  cierre.saldo = resumen.saldo;
  cierre.notas = input.notas || null;
  cierre.activo = true;
  cierre.reabierto_en = null;
  cierre.id_junta = juntaId;
  cierre.usuario = input.idUsuario ? ({ id: input.idUsuario } as Usuario) : null;
  const saved = await repo().save(cierre);

  await registrarEvento({
    idUsuario: input.idUsuario,
    accion: 'caja.cerrar',
    entidad: 'cierre_caja',
    entidadId: saved.id,
    detalle: { tipo: input.tipo, periodo: input.periodo, ...resumen },
  });

  return saved;
};

export const reabrirCierre = async (id: number, idUsuario?: number) => {
  const juntaId = getJuntaId();
  const cierre = await repo().findOne({ where: { id, id_junta: juntaId } });
  if (!cierre) throw new Error('Cierre no encontrado');
  if (!cierre.activo) throw new Error('El cierre ya está reabierto');
  cierre.activo = false;
  cierre.reabierto_en = new Date();
  const saved = await repo().save(cierre);

  await registrarEvento({
    idUsuario,
    accion: 'caja.reabrir',
    entidad: 'cierre_caja',
    entidadId: saved.id,
    detalle: { tipo: saved.periodo_tipo, periodo: saved.periodo },
  });

  return saved;
};

export const listCierres = async (params: {
  page?: string | number;
  limit?: string | number;
}) => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const [resultado, total] = await repo().findAndCount({
    where: { id_junta: juntaId },
    relations: ['usuario'],
    order: { cerrado_en: 'DESC' },
    skip,
    take: limit,
  });
  return { resultado, total, page, limit };
};

export const exportCierreCsv = async (id: number) => {
  const juntaId = getJuntaId();
  const cierre = await repo().findOne({ where: { id, id_junta: juntaId }, relations: ['usuario'] });
  if (!cierre) throw new Error('Cierre no encontrado');

  const range = rangeForPeriodo(cierre.periodo_tipo, cierre.periodo);
  const movimientos = await AppDataSource.getRepository(Transaccion)
    .createQueryBuilder('t')
    .leftJoinAndSelect('t.tipo_ingreso', 'tipo')
    .where('t.delete = false')
    .andWhere('t.id_junta = :juntaId', { juntaId })
    .andWhere('t.fecha BETWEEN :desde AND :hasta', {
      desde: new Date(`${range.desdeFecha}T00:00:00`),
      hasta: new Date(`${range.hastaFecha}T23:59:59`),
    })
    .orderBy('t.fecha', 'ASC')
    .getMany();

  const headerBlock = toCsv(
    ['periodo_tipo', 'periodo', 'ingresos', 'egresos', 'saldo', 'activo'],
    [
      [
        cierre.periodo_tipo,
        cierre.periodo,
        Number(cierre.ingresos),
        Number(cierre.egresos),
        Number(cierre.saldo),
        cierre.activo ? 'si' : 'no',
      ],
    ]
  );

  const movCsv = toCsv(
    ['id', 'fecha', 'motivo', 'tipo', 'monto'],
    movimientos.map((m) => [
      m.id,
      new Date(m.fecha).toISOString(),
      m.motivo,
      m.tipo_ingreso?.descripcion || '',
      Number(m.monto),
    ])
  );

  return `${headerBlock}\n\n${movCsv}`;
};
