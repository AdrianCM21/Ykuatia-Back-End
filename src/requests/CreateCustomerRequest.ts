import {check} from "express-validator"
import ValidationChainHandler from "../handlers/ValidationChainHandler"

export default ValidationChainHandler([

    check('ruc').isString().matches(/^[0-9]+[A-Z]?(-[0-9])?$/).withMessage('Formato de ruc no valido'),
    check('razon_social').isString().isLength({max:45,min:4}).withMessage('Dato ingresado tiene que ser mayor a 3 y menor a 45 caracteres'),
    check('email').isString().isEmail().withMessage('Formato de correo incorrecto'),
    check('nombre_fantasia').isString().isLength({max:45,min:4}).withMessage('Dato ingresado tiene que ser mayor a 3 y menor a 45 caracteres'),
    check('telefono').isString().isLength({max:12,min:5}).withMessage('Dato ingresado tiene que ser mayor a 5 y menor a 13 caracteres').matches(/^\d{8,13}$/).withMessage('Solo permite numeros'),
    check('celular').isString().isLength({max:12}).withMessage('Dato ingresado tiene que ser  menor a 13 caracteres'),
    check('direccion').isString().isLength({max:45}).withMessage('Dato ingresado tiene que ser menor a 45 caracteres'),
    check('ciudad').matches(/^\d+$/).withMessage('Solo permite numeros'),
    check('departamento').isString().matches(/^\d+$/).withMessage('Solo permite numeros'),
    check('distrito').isString().matches(/^\d+$/).withMessage('Solo permite numeros')
  

]);