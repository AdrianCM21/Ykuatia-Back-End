import { body } from 'express-validator';
import Request from '../handlers/ValidationChainHandler';
import { UserRole } from '../enum/userRoles';

const ROLES_ASIGNABLES = [
  UserRole.ADMIN,
  UserRole.PRESIDENTE,
  UserRole.TESORERO,
  UserRole.CAJERO,
  UserRole.AGENTE_CAMPO,
];

export const CreateUsuarioRequest = Request([
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('Nombre').isString().trim().notEmpty().withMessage('Nombre requerido'),
  body('rol').isIn(ROLES_ASIGNABLES),
]);

export const UpdateUsuarioRequest = Request([
  body('email').optional().isEmail(),
  body('Nombre').optional().isString().trim().notEmpty(),
  body('rol').optional().isIn(ROLES_ASIGNABLES),
]);

export const ResetPasswordRequest = Request([
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
]);
