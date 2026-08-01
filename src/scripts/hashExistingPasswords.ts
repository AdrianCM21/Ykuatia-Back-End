import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/db.config';
import { Usuario } from '../models/usuarios';
import { isBcryptHash } from '../utils/isBcryptHash';

require('dotenv').config({ path: '.env' });

const SALT_ROUNDS = 10;

const hashExistingPasswords = async (): Promise<void> => {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Usuario);
  const usuarios = await repo.find();

  let actualizados = 0;

  for (const usuario of usuarios) {
    if (isBcryptHash(usuario.password)) {
      continue;
    }

    usuario.password = await bcrypt.hash(usuario.password, SALT_ROUNDS);
    await repo.save(usuario);
    actualizados += 1;
    console.log(`Password hasheado para usuario id=${usuario.id} email=${usuario.email}`);
  }

  console.log(`Listo. Usuarios actualizados: ${actualizados}`);
  await AppDataSource.destroy();
};

hashExistingPasswords().catch(async (error) => {
  console.error('Error al hashear passwords:', error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
