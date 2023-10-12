import {check} from "express-validator"
import ValidationChainHandler from "../handlers/ValidationChainHandler"

export default ValidationChainHandler([

    check('cedula').matches(/^\d+$/).withMessage('Solo permite numeros'),
    check('nombre').isString().isLength({max:45,min:4}).withMessage('Dato ingresado tiene que ser mayor a 3 y menor a 45 caracteres'),
    check('telefono').isString().isLength({max:12,min:5}).withMessage('Dato ingresado tiene que ser mayor a 5 y menor a 13 caracteres').matches(/^\d{8,13}$/).withMessage('Solo permite numeros'),
    check('direccion').isString().isLength({max:45}).withMessage('Dato ingresado tiene que ser menor a 45 caracteres'),
    check('longitud').matches(/^\d+$/).withMessage('Solo permite numeros'),
    check('latitud').isString().matches(/^\d+$/).withMessage('Solo permite numeros')
]);