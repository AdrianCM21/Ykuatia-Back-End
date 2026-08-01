const findOne = jest.fn();

jest.mock('../../config/db.config', () => ({
  AppDataSource: {
    getRepository: () => ({ findOne }),
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginService } from '../login/login';

describe('loginService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MI_CLAVESECRETA = 'test-secret-key-ykuatia';
  });

  it('devuelve null si el usuario no existe', async () => {
    findOne.mockResolvedValue(null);
    await expect(loginService('a@b.com', 'x')).resolves.toBeNull();
  });

  it('devuelve null si la contraseña es inválida', async () => {
    findOne.mockResolvedValue({
      id: 1,
      Nombre: 'Admin',
      password: 'hash',
      id_junta: 1,
      rol: { descripcion: 'admin' },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(loginService('a@b.com', 'bad')).resolves.toBeNull();
  });

  it('firma JWT con rol y juntaId', async () => {
    findOne.mockResolvedValue({
      id: 9,
      Nombre: 'Tesorero',
      password: 'hash',
      id_junta: 3,
      rol: { descripcion: 'tesorero' },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const token = await loginService('t@b.com', 'ok');
    expect(typeof token).toBe('string');
    const payload = jwt.verify(token!, 'test-secret-key-ykuatia') as {
      id: number;
      rol: string;
      juntaId: number;
    };
    expect(payload).toMatchObject({ id: 9, rol: 'tesorero', juntaId: 3 });
  });
});
