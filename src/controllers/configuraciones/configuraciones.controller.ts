import {Request, Response } from 'express'
import { getConfiguraciones, updateConfiguraciones } from '../../services/configuraciones/configuraciones.service'
export const getConfiguracionesController = async (req: Request, res: Response) => {
    try {
        const result = await getConfiguraciones()
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

export const updateConfiguracionesController = async (req: Request, res: Response) => {
    const data =req.body
    try {
        const result = await updateConfiguraciones(data)
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}
