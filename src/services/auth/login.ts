
import { AppDataSource } from '../../config/db.config';
import { usuarios } from '../../models/db-models/usuarios';
require('dotenv').config({ path: '.env' }); 
const RepositorioUsuarios = AppDataSource.getRepository(usuarios)
const jwt = require('jsonwebtoken')
const loginService = async (email: string, password: string): Promise<string | null> => {
    try {
      const user = await RepositorioUsuarios.findOneBy({ email: email });
    
      if (!user) {
        return null; 
      }
  
      const esValido = password === user.password;
  
      if (!esValido) {
        return null; // Contraseña incorrecta
      }
      console.log( process.env.MI_CLAVESECRETA)
      const secret = process.env.MI_CLAVESECRETA;
      const newJWT = jwt.sign({ id: user.id, nombre: user.Nombre }, secret);
      console.log('sdf')
      return newJWT;
    } catch (error) {
      console.error(error);
      throw error; 
    }
  };
export {loginService}