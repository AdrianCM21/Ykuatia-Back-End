import {Request, Response } from 'express'
import { addTransaciones, getTransaciones } from '../../services/transaciones/transaciones.service'
import IAddTransacion from '../../interfaces/transaciones/IAddTransaciones'
export const getTransacionesController = async (req: Request, res: Response) => {
    const { desde } = req.query
    try {
        const result = await getTransaciones(Number(desde))
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}


export const addTransacionController = async (req: Request<{}, {}, IAddTransacion>, res: Response) => {
    const data = req.body
    try {
        const result = await addTransaciones(data)
        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}