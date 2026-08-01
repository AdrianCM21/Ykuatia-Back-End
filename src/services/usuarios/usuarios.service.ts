import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/db.config';
import { RolUsuario, Usuario } from '../../models/usuarios';
import { isPresidenteRole, UserRole } from '../../enum/userRoles';
import { getJuntaId } from '../../utils/juntaContext';

const userRepo = () => AppDataSource.getRepository(Usuario);
const rolRepo = () => AppDataSource.getRepository(RolUsuario);

export type CreateUserInput = {
  email: string;
  password: string;
  Nombre: string;
  rol: string;
};

export type UpdateUserInput = {
  email?: string;
  Nombre?: string;
  rol?: string;
};

const SALT_ROUNDS = 10;

const findRol = async (descripcion: string) => {
  const rol = await rolRepo().findOne({ where: { descripcion } });
  if (!rol) {
    throw new Error('Rol no válido');
  }
  return rol;
};

export const listUsuarios = async (): Promise<Omit<Usuario, 'password'>[]> => {
  const juntaId = getJuntaId();
  const users = await userRepo().find({
    where: { id_junta: juntaId },
    relations: ['rol'],
  });
  return users.map(({ password, ...rest }) => rest);
};

export const createUsuario = async (data: CreateUserInput) => {
  const juntaId = getJuntaId();
  const existing = await userRepo().findOne({ where: { email: data.email } });
  if (existing) {
    throw new Error('El email ya está registrado');
  }
  if (data.password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  const rol = await findRol(data.rol);
  const user = new Usuario();
  user.email = data.email;
  user.Nombre = data.Nombre;
  user.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  user.rol = rol;
  user.id_junta = juntaId;
  const saved = await userRepo().save(user);
  const { password, ...safe } = saved;
  return safe;
};

export const updateUsuario = async (id: number, data: UpdateUserInput) => {
  const juntaId = getJuntaId();
  const user = await userRepo().findOne({
    where: { id, id_junta: juntaId },
    relations: ['rol'],
  });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  if (data.email) user.email = data.email;
  if (data.Nombre) user.Nombre = data.Nombre;
  if (data.rol) user.rol = await findRol(data.rol);
  const saved = await userRepo().save(user);
  const { password, ...safe } = saved;
  return safe;
};

export const resetPassword = async (id: number, password: string) => {
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }
  const juntaId = getJuntaId();
  const user = await userRepo().findOne({
    where: { id, id_junta: juntaId },
    relations: ['rol'],
  });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  await userRepo().save(user);
  return { message: 'Contraseña actualizada' };
};

export const deleteUsuario = async (id: number, currentUserId?: number) => {
  if (currentUserId && currentUserId === id) {
    throw new Error('No podés eliminar tu propio usuario');
  }
  const juntaId = getJuntaId();
  const user = await userRepo().findOne({
    where: { id, id_junta: juntaId },
    relations: ['rol'],
  });
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  if (isPresidenteRole(user.rol.descripcion)) {
    const admins = await userRepo()
      .createQueryBuilder('u')
      .leftJoin('u.rol', 'rol')
      .where('u.id_junta = :juntaId', { juntaId })
      .andWhere('rol.descripcion IN (:...roles)', {
        roles: [UserRole.ADMIN, UserRole.PRESIDENTE],
      })
      .getCount();
    if (admins <= 1) {
      throw new Error('No se puede eliminar el último presidente/administrador');
    }
  }
  await userRepo().remove(user);
  return { message: 'Usuario eliminado' };
};
