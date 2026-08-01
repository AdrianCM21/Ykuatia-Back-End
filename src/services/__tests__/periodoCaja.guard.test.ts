const findOne = jest.fn();

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({ findOne }),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

import { assertPeriodoAbierto } from '../caja/periodoCaja.guard';

describe('assertPeriodoAbierto', () => {
  beforeEach(() => {
    findOne.mockReset();
  });

  it('permite operar si no hay cierres activos', async () => {
    findOne.mockResolvedValue(null);
    await expect(assertPeriodoAbierto(new Date('2026-08-01T12:00:00Z'))).resolves.toBeUndefined();
    expect(findOne).toHaveBeenCalledTimes(2);
  });

  it('bloquea si el día está cerrado', async () => {
    findOne.mockResolvedValueOnce({ id: 1, activo: true });
    await expect(assertPeriodoAbierto(new Date('2026-08-01T12:00:00Z'))).rejects.toThrow(
      /caja del día/
    );
  });

  it('bloquea si el mes está cerrado', async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2, activo: true });
    await expect(assertPeriodoAbierto(new Date('2026-08-01T12:00:00Z'))).rejects.toThrow(
      /caja del mes/
    );
  });
});
