import { body, query } from 'express-validator';
import Request from '../handlers/ValidationChainHandler';

export const AddCajaRequest = Request([
  body('monto').notEmpty().withMessage('Monto requerido'),
  body('motivo').isString().isLength({ min: 2, max: 80 }),
  body('tipo_transacion').isIn(['1', '2', 1, 2]),
  body('id_factura').optional({ nullable: true }).isInt({ min: 1 }),
]);

export const CajaResumenQuery = Request([
  query('desdeFecha').optional().isISO8601().toDate(),
  query('hastaFecha').optional().isISO8601().toDate(),
]);
