import { Request, Response } from 'express';
import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
import * as CustomerService from '../../services/customer/customer.service';
import { appendAuditoria, getAuditoriaId, newAuditoria } from '../../services/auditoria/auditoria.service';

const getClientes = async (req: Request, res: Response) => {
    const { desde } = req.query
    try {
        const result = await CustomerService.getClientes(Number(desde))
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

const getClientesConFactura = async (req: Request, res: Response) => {
    const { desde } = req.query
    try {
        const result = await CustomerService.getClientesConFactura(Number(desde))
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

const getCustomerTypes = async (req: Request, res: Response) => {
    try {
        const result = await CustomerService.getCustomerTypes()
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

const addCliente = async (req: Request<{}, {}, IAddUpdateCustomer>, res: Response) => {
    const data = req.body
    try {
        const idAuditora= await newAuditoria('cliente')
        const result = await CustomerService.addCliente(data,idAuditora)
        await appendAuditoria(idAuditora,`Se creo el cliente ${result.nombre} con cedula ${result.cedula}`)
        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}

const updateCliente = async (req: Request<{ id: string }, {}, IAddUpdateCustomer>, res: Response) => {
    const { id } = req.params
    const data = req.body
    try {
        const idAuditora= await getAuditoriaId(Number(id))
        const result = await CustomerService.updateCliente(id, data)
        if(idAuditora) await appendAuditoria(idAuditora,`Se actualizo el cliente ${data.nombre} con cedula ${data.cedula} `)

        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

const deleteCliente = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const idAuditora= await getAuditoriaId(Number(id))
        const result = await CustomerService.deleteCliente(id)
        if(idAuditora) await appendAuditoria(idAuditora,`Se elimino el cliente con id ${id} `)
        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}

export { addCliente, getClientes, updateCliente, deleteCliente,getCustomerTypes,getClientesConFactura
}

