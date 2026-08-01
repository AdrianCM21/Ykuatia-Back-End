import { AppDataSource } from '../../config/db.config';
import { Lectura } from '../../models/lecturas';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { Usuario } from '../../models/usuarios';
import { resolvePagination } from '../../utils/pagination';
import { getJuntaId, tryGetJuntaId } from '../../utils/juntaContext';

const repo = () => AppDataSource.getRepository(Lectura);

export const registrarLectura = async (input: {
  cliente: Cliente;
  factura?: Factura | null;
  consumo: number;
  origen?: string;
  idUsuario?: number | null;
}): Promise<Lectura> => {
  const lectura = new Lectura();
  lectura.cliente = input.cliente;
  lectura.factura = input.factura ?? null;
  lectura.consumo = Number(input.consumo);
  lectura.origen = input.origen || 'oficina';
  lectura.usuario = input.idUsuario ? ({ id: input.idUsuario } as Usuario) : null;
  lectura.id_junta = tryGetJuntaId() ?? input.cliente.id_junta ?? 1;
  return repo().save(lectura);
};

export const getLecturasByCliente = async (
  clienteId: number,
  params: { page?: string | number; limit?: string | number }
) => {
  const juntaId = getJuntaId();
  const { skip, limit, page } = resolvePagination(params);
  const qb = repo()
    .createQueryBuilder('l')
    .leftJoinAndSelect('l.factura', 'factura')
    .leftJoinAndSelect('l.usuario', 'usuario')
    .where('l.id_cliente = :clienteId', { clienteId })
    .andWhere('l.id_junta = :juntaId', { juntaId })
    .orderBy('l.fecha', 'DESC')
    .skip(skip)
    .take(limit);

  const [resultado, total] = await qb.getManyAndCount();
  return { resultado, total, page, limit };
};
