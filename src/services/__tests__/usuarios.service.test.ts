const userFind = jest.fn();
const userFindOne = jest.fn();
const userSave = jest.fn();
const userRemove = jest.fn();
const userCountQb = {
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getCount: jest.fn(),
};
const rolFindOne = jest.fn();

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: (Entity: { name: string }) => {
      if (Entity.name === 'Usuario') {
        return {
          find: userFind,
          findOne: userFindOne,
          save: userSave,
          remove: userRemove,
          createQueryBuilder: () => userCountQb,
        };
      }
      if (Entity.name === 'RolUsuario') {
        return { findOne: rolFindOne };
      }
      return {};
    },
  },
}));

jest.mock('../../utils/juntaContext', () => ({
  getJuntaId: () => 1,
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
}));

import {
  createUsuario,
  deleteUsuario,
  listUsuarios,
} from '../usuarios/usuarios.service';

describe('usuarios.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista usuarios sin password', async () => {
    userFind.mockResolvedValue([{ id: 1, email: 'a@b.com', password: 'secret', Nombre: 'A', rol: {} }]);
    const rows = await listUsuarios();
    expect(rows[0]).not.toHaveProperty('password');
    expect(rows[0].email).toBe('a@b.com');
  });

  it('crea usuario con rol y junta', async () => {
    userFindOne.mockResolvedValue(null);
    rolFindOne.mockResolvedValue({ id_rol: 4, descripcion: 'cajero' });
    userSave.mockImplementation(async (u) => ({ ...u, id: 11 }));

    const created = await createUsuario({
      email: 'c@ykuatia.local',
      password: 'secret1',
      Nombre: 'Cajero',
      rol: 'cajero',
    });

    expect(created.id).toBe(11);
    expect(userSave).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'c@ykuatia.local',
        password: 'hashed',
        id_junta: 1,
      })
    );
  });

  it('no elimina el último presidente/admin', async () => {
    userFindOne.mockResolvedValue({
      id: 1,
      rol: { descripcion: 'admin' },
    });
    userCountQb.getCount.mockResolvedValue(1);

    await expect(deleteUsuario(1, 99)).rejects.toThrow(/último presidente/);
  });

  it('no permite autoeliminarse', async () => {
    await expect(deleteUsuario(5, 5)).rejects.toThrow(/propio usuario/);
  });
});
