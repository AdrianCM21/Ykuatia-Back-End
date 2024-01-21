import { Request, Response } from 'express';
import { controlCliente} from "../../services/facturas/facturaJob.service"
import { completadoConsumoService, filtrarClientesConFacturas, filtrarFacturasPendientes, getFacturas, obtenerCliente, obtenerClientes, pagoFactura } from '../../services/facturas/factura.service';
import { createInvoice } from '../../services/facturas/pdf.service';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { unlinkSync } from 'fs';
import { Factura } from '../../models/facturas';

const controlFacturas = async () => {
    try {
        // await controlCliente();
        // console.log('se genero una factura')
    } catch (error) {
        throw error
    }
}

const completadoFacturaConsumo = async (req: Request, res: Response) => {
    const { id} = req.params
    const { consumo } = req.body
    try {
        if (!id || !consumo) {
            res.status(400).json({ message: 'Faltan datos' });
            return;
        }
        const result = await completadoConsumoService(id, consumo);
        if (!result) {
            res.status(404).json({ message: 'No se encontro la factura' });
            return;
        }
        res.json({ message: result });
        
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
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

const descargarFactura = async (req: Request, res: Response) => {
    try {
        const {id} = req.query;
        let clientes
        if (!id) {
            clientes = await obtenerClientes();
        }else{
            clientes = await obtenerCliente(id as string);
        }
        
        if (!clientes) {
            res.status(404).json({ message: 'No hay clientes registrados' });
            return;
        }

        const clientesConFacturas = filtrarClientesConFacturas(clientes);
        if (!clientesConFacturas.length) {
            res.status(404).json({ message: 'No hay clientes con facturas' });
            return;
        }

        const clientesConFacturasPendientes = filtrarFacturasPendientes(clientesConFacturas);
    
        const pdfDoc = await createInvoice(clientesConFacturasPendientes);
        // ...

        pdfDoc.getBuffer((buffer) => {
            const filePath = join(__dirname, 'invoices.pdf');
            writeFileSync(filePath, buffer);
            res.download(filePath, 'invoices.pdf', (err) => {
                if (err) {
                    res.status(500).send({ message: 'Error al descargar el archivo' });
                } else {
                    unlinkSync(filePath); // Eliminar el archivo después de descargarlo
                }
            });
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Error al generar las facturas' });
    }
}

const pagoFacturaController = async (req: Request, res: Response) => {
    const {pagos:facturas} = req.body
    try {
        if (!facturas) {
            res.status(400).json({ message: 'Faltan datos' });
            return;
        }
        facturas.forEach(async (factura:{id:number}) => {
            await pagoFactura(factura.id)
        });
        res.json({ message: 'Facturas pagadas' });
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}
export { controlFacturas, getFacturasController, descargarFactura, completadoFacturaConsumo,pagoFacturaController}
