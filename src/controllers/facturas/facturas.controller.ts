import { Request, Response } from 'express';
import { controlClienteTarifaFija } from "../../services/facturas/facturaJob.service"
import { filtrarClientesConFacturas, filtrarFacturasPendientes, getFacturas, obtenerCliente, obtenerClientes } from '../../services/facturas/factura.service';
import { createInvoice } from '../../services/facturas/pdf.service';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { unlinkSync } from 'fs';

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

const descargarFactura = async (req: Request, res: Response) => {
    try {
        const {id} = req.query;
        console.log(id)
        let clientes
        if (!id) {
            clientes = await obtenerClientes();
        }else{
            clientes = await obtenerCliente(id as string);
        }
        
        if (!clientes) {
            res.status(400).json({ message: 'No hay clientes registrados' });
            return;
        }

        const clientesConFacturas = filtrarClientesConFacturas(clientes);
        if (!clientesConFacturas.length) {
            res.status(400).json({ message: 'No hay clientes con facturas' });
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
export { controlFacturas, getFacturasController, descargarFactura}
