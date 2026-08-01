import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../../config/db.config';
import { Usuario } from '../../models/usuarios';

require('dotenv').config({ path: '.env' });

const RepositorioUsuarios = AppDataSource.getRepository(Usuario);

const loginService = async (email: string, password: string): Promise<string | null> => {
  try {
    const user = await RepositorioUsuarios.findOne({
      where: { email },
      relations: ['rol'],
    });

    if (!user) {
      return null;
    }

    const esValido = await bcrypt.compare(password, user.password);
    if (!esValido) {
      return null;
    }

    const secret = process.env.MI_CLAVESECRETA;
    if (!secret) {
      throw new Error('MI_CLAVESECRETA no está definida');
    }

    const juntaId = Number(user.id_junta || 1);

    const newJWT = jwt.sign(
      {
        id: user.id,
        nombre: user.Nombre,
        rol: user.rol.descripcion,
        juntaId,
      },
      secret,
      { expiresIn: '8h' }
    );

    return newJWT;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { loginService };
