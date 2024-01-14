import { Request, Response } from 'express';
import { controlClienteTarifaFija } from "../../services/facturas/facturaJob.service"
import { getFacturas } from '../../services/facturas/factura.service';

const controlFacturas = async () => {
    try {
        // await controlClienteTarifaFija();
        console.log('se genero una factura')
    } catch (error) {
        throw error
    }
}

const getFacturasController = async (req: Request, res: Response) => {
    const { desde } = req.query
    try {
        const result = await getFacturas(Number(desde))
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

export { controlFacturas, getFacturasController }
