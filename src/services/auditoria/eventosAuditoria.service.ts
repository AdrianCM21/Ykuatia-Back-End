import { AppDataSource } from '../../config/db.config';
import { EventoAuditoria } from '../../models/eventoAuditoria';
import { Usuario } from '../../models/usuarios';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId, tryGetJuntaId } from '../../utils/juntaContext';

const repo = () => AppDataSource.getRepository(EventoAuditoria);

export type RegistrarEventoInput = {
  idUsuario?: number | null;
  accion: string;
  entidad: string;
  entidadId?: number | null;
  detalle?: Record<string, unknown> | string | null;
};

export const registrarEvento = async (input: RegistrarEventoInput): Promise<EventoAuditoria> => {
  const evento = new EventoAuditoria();
  evento.accion = input.accion;
  evento.entidad = input.entidad;
  evento.entidad_id = input.entidadId ?? null;
  evento.detalle =
    typeof input.detalle === 'string' || input.detalle == null
      ? (input.detalle as string | null)
      : JSON.stringify(input.detalle);

  if (input.idUsuario) {
    evento.usuario = { id: input.idUsuario } as Usuario;
  } else {
    evento.usuario = null;
  }

  evento.id_junta = tryGetJuntaId() ?? 1;

  return repo().save(evento);
};

export const listEventos = async (params: {
  page?: string | number;
  limit?: string | number;
  entidad?: string;
  entidadId?: string | number;
  q?: string;
}) => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = repo()
    .createQueryBuilder('e')
    .leftJoinAndSelect('e.usuario', 'usuario')
    .where('e.id_junta = :juntaId', { juntaId })
    .orderBy('e.created_at', 'DESC');

  if (params.entidad) {
    qb.andWhere('e.entidad = :entidad', { entidad: params.entidad });
  }
  if (params.entidadId != null && params.entidadId !== '') {
    qb.andWhere('e.entidad_id = :entidadId', { entidadId: Number(params.entidadId) });
  }
  if (params.q) {
    qb.andWhere('(e.accion LIKE :q OR e.detalle LIKE :q OR usuario.Nombre LIKE :q)', {
      q: `%${params.q}%`,
    });
  }

  qb.skip(skip).take(limit);
  const [resultado, total] = await qb.getManyAndCount();
  return { resultado, total, page, limit };
};
