
import { AppDataSource } from '../../config/db.config';
import { Usuario } from '../../models/db-models/usuarios';
require('dotenv').config({ path: '.env' });
const RepositorioUsuarios = AppDataSource.getRepository(Usuario);
const jwt = require('jsonwebtoken');

const loginService = async (email: string, password: string): Promise<{ token: string | null, roles: string[] | null }> => {
  try {
    const user = await RepositorioUsuarios.findOneBy({ email: email });

    if (!user) {
      return { token: null, roles: null };
    }

    const esValido = password === user.password;

    if (!esValido) {
      return { token: null, roles: null }; // Contraseña incorrecta
    }

    const secret = process.env.MI_CLAVESECRETA;
    const newJWT = jwt.sign({ id: user.id, nombre: user.Nombre }, secret);

    return { token: newJWT, roles: user.rol };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { loginService };
