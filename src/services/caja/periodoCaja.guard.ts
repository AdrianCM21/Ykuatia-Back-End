import { AppDataSource } from '../../config/db.config';
import { CierreCaja } from '../../models/cierreCaja';
import { getJuntaId } from '../../utils/juntaContext';

const repo = () => AppDataSource.getRepository(CierreCaja);

export const assertPeriodoAbierto = async (fecha: Date = new Date()) => {
  const juntaId = getJuntaId();
  const dia = fecha.toISOString().slice(0, 10);
  const mes = dia.slice(0, 7);

  const cierreDia = await repo().findOne({
    where: { periodo_tipo: 'dia', periodo: dia, activo: true, id_junta: juntaId },
  });
  if (cierreDia) {
    throw new Error(`La caja del día ${dia} está cerrada`);
  }

  const cierreMes = await repo().findOne({
    where: { periodo_tipo: 'mes', periodo: mes, activo: true, id_junta: juntaId },
  });
  if (cierreMes) {
    throw new Error(`La caja del mes ${mes} está cerrada`);
  }
};
