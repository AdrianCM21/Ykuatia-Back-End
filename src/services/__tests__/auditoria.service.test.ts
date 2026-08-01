const save = jest.fn();
const findOneBy = jest.fn();
const findOneCliente = jest.fn();

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: (Entity: { name: string }) => {
      if (Entity.name === 'Auditoria') {
        return { findOneBy, save };
      }
      if (Entity.name === 'Cliente') {
        return { findOne: findOneCliente };
      }
      return {};
    },
    manager: { save },
  },
}));

import { appendAuditoria, getAuditoriaId, newAuditoria } from '../auditoria/auditoria.service';

describe('auditoria.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('crea nueva auditoria', async () => {
    save.mockResolvedValue({ id: 11 });
    await expect(newAuditoria('cliente')).resolves.toBe(11);
  });

  it('obtiene id de auditoria del cliente', async () => {
    findOneCliente.mockResolvedValue({ auditoria: { id: 4 } });
    await expect(getAuditoriaId(1)).resolves.toBe(4);
  });

  it('append agrega línea al historial', async () => {
    findOneBy.mockResolvedValue({ id: 4, historial_cambios: 'inicio' });
    save.mockImplementation(async (a) => a);

    const result = await appendAuditoria(4, 'Pago parcial');
    expect(result).not.toBe(0);
    if (result === 0) return;
    expect(result.historial_cambios).toContain('Pago parcial');
    expect(result.historial_cambios.startsWith('inicio')).toBe(true);
  });

  it('append con id 0 no hace nada', async () => {
    await expect(appendAuditoria(0, 'x')).resolves.toBe(0);
    expect(findOneBy).not.toHaveBeenCalled();
  });
});
