
import { AppDataSource } from '../../config/db.config';
import { Usuario } from '../../models/usuarios';
require('dotenv').config({ path: '.env' });
const RepositorioUsuarios = AppDataSource.getRepository(Usuario);
const jwt = require('jsonwebtoken');

const loginService = async (email: string, password: string): Promise<string | null> => {
  try {
    const config ={ 
      where:{ email},
      relations:['rol']
     }
    const user = await RepositorioUsuarios.findOne(config);

    if (!user) {
      return null;
    }

    const esValido = password === user.password;

    if (!esValido) {
      return null; // Contraseña incorrecta
    }

    const secret = process.env.MI_CLAVESECRETA;
    const newJWT = jwt.sign({ id: user.id, nombre: user.Nombre ,rol:user.rol.descripcion }, secret);

    return newJWT
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { loginService };
