const findOne = jest.fn();
const save = jest.fn();
const create = jest.fn((data) => data);

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({ findOne, save, create }),
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  tryGetJuntaId: () => 1,
  getJuntaId: () => 1,
}));

import { clearJuntaLogo, getJuntaConfig, updateJuntaConfig } from '../junta/junta.service';

describe('junta.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve config existente', async () => {
    findOne.mockResolvedValue({ id: 1, nombre: 'Ykuatia', id_junta: 1, version: 2 });
    const cfg = await getJuntaConfig();
    expect(cfg.nombre).toBe('Ykuatia');
    expect(save).not.toHaveBeenCalled();
  });

  it('crea config por defecto si no existe', async () => {
    findOne.mockResolvedValue(null);
    save.mockImplementation(async (c) => ({ ...c, id: 1 }));
    const cfg = await getJuntaConfig();
    expect(cfg.plantilla_boleta).toBe('clasica');
    expect(cfg.dias_gracia).toBe(14);
    expect(save).toHaveBeenCalled();
  });

  it('actualiza mora y plantilla', async () => {
    findOne.mockResolvedValue({
      id: 1,
      nombre: 'Ykuatia',
      version: 1,
      color_primario: '#0B6E6E',
      color_secundario: '#1F4E79',
      dias_gracia: 14,
      mora_pct: 0,
      plantilla_boleta: 'clasica',
    });
    save.mockImplementation(async (c) => c);

    const updated = await updateJuntaConfig({
      dias_gracia: 10,
      mora_pct: 5,
      plantilla_boleta: 'formal',
    });

    expect(updated.dias_gracia).toBe(10);
    expect(Number(updated.mora_pct)).toBe(5);
    expect(updated.plantilla_boleta).toBe('formal');
    expect(updated.version).toBe(2);
  });

  it('rechaza plantilla inválida', async () => {
    findOne.mockResolvedValue({
      id: 1,
      version: 1,
      color_primario: '#0B6E6E',
      color_secundario: '#1F4E79',
    });
    await expect(updateJuntaConfig({ plantilla_boleta: 'rara' })).rejects.toThrow(
      /plantilla_boleta inválida/
    );
  });

  it('elimina logo principal', async () => {
    findOne.mockResolvedValue({
      id: 1,
      version: 3,
      logo_principal: '/uploads/junta/logo-x.png',
      logo_secundario: null,
    });
    save.mockImplementation(async (c) => c);

    const updated = await clearJuntaLogo('principal');
    expect(updated.logo_principal).toBeNull();
    expect(updated.version).toBe(4);
  });

  it('acepta plantilla básica con papel oficio y 4 por hoja', async () => {
    findOne.mockResolvedValue({
      id: 1,
      version: 1,
      color_primario: '#0B6E6E',
      color_secundario: '#1F4E79',
      plantilla_boleta: 'clasica',
      papel_boleta: 'a4',
      boletas_por_pagina: 2,
    });
    save.mockImplementation(async (c) => c);

    const updated = await updateJuntaConfig({
      plantilla_boleta: 'basica',
      papel_boleta: 'oficio',
      boletas_por_pagina: 4,
    });

    expect(updated.plantilla_boleta).toBe('basica');
    expect(updated.papel_boleta).toBe('oficio');
    expect(updated.boletas_por_pagina).toBe(4);
  });
});
