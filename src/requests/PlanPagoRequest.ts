import { body } from 'express-validator';
import Request from '../handlers/ValidationChainHandler';

export const CreatePlanPagoRequest = Request([
  body('id_cliente').isInt({ min: 1 }),
  body('id_factura').optional({ nullable: true }).isInt({ min: 1 }),
  body('monto_total').isFloat({ gt: 0 }),
  body('cuotas').isInt({ min: 1, max: 60 }),
  body('notas').optional().isString(),
]);

export const UpdatePlanPagoRequest = Request([
  body('accion').isIn(['marcar_cuota', 'cancelar']),
  body('notas').optional().isString(),
]);
