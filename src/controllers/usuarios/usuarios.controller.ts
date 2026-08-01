import { Request, Response } from 'express';
import {
  createUsuario,
  deleteUsuario,
  listUsuarios,
  resetPassword,
  updateUsuario,
} from '../../services/usuarios/usuarios.service';

export const getUsuariosController = async (_req: Request, res: Response) => {
  try {
    const users = await listUsuarios();
    res.json(users);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al listar usuarios',
    });
  }
};

export const createUsuarioController = async (req: Request, res: Response) => {
  try {
    const user = await createUsuario(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al crear usuario',
    });
  }
};

export const updateUsuarioController = async (req: Request, res: Response) => {
  try {
    const user = await updateUsuario(Number(req.params.id), req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al actualizar usuario',
    });
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const result = await resetPassword(Number(req.params.id), req.body.password);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al resetear contraseña',
    });
  }
};

export const deleteUsuarioController = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const result = await deleteUsuario(Number(req.params.id), currentUserId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : 'Error al eliminar usuario',
    });
  }
};
