import { body } from 'express-validator';
import Request from '../handlers/ValidationChainHandler';

export const PagoFacturaRequest = Request([
  body('pagos').isArray({ min: 1 }).withMessage('Debés indicar al menos una factura'),
  body('pagos.*.id').isInt({ min: 1 }).withMessage('id de factura inválido'),
  body('pagos.*.monto').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('monto inválido'),
  body('pagos.*.incluirMora').optional().isBoolean(),
  body('pagos.*.id_plan').optional({ nullable: true }).isInt({ min: 1 }).withMessage('id_plan inválido'),
]);

export const RevertirAbonoRequest = Request([
  body('id_transaccion').isInt({ min: 1 }).withMessage('id_transaccion inválido'),
]);
