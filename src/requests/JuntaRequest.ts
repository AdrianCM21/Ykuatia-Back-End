import { body } from 'express-validator';
import Request from '../handlers/ValidationChainHandler';

const HEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const UpdateJuntaRequest = Request([
  body('nombre').optional().isString().isLength({ min: 2, max: 120 }),
  body('slogan').optional().isString().isLength({ max: 180 }),
  body('direccion').optional().isString().isLength({ max: 180 }),
  body('telefono').optional().isString().isLength({ max: 40 }),
  body('email').optional().isString().isLength({ max: 80 }),
  body('pie_boleta').optional().isString(),
  body('pie_recibo').optional().isString(),
  body('color_primario').optional().matches(HEX).withMessage('color_primario inválido'),
  body('color_secundario').optional().matches(HEX).withMessage('color_secundario inválido'),
  body('margen_mm').optional().isInt({ min: 20, max: 80 }),
  body('mostrar_timbrado').optional().isBoolean(),
  body('timbrado').optional().isString().isLength({ max: 80 }),
  body('ruc').optional().isString().isLength({ max: 40 }),
  body('dias_gracia').optional().isInt({ min: 0, max: 90 }),
  body('mora_pct').optional().isFloat({ min: 0, max: 100 }),
  body('plantilla_boleta').optional().isIn(['clasica', 'compacta', 'formal', 'basica']),
  body('papel_boleta').optional().isIn(['a4', 'oficio']),
  body('boletas_por_pagina').optional().isIn([2, 4]),
]);
