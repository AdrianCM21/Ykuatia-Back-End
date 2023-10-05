import { Request, Response } from 'express';
import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
import * as CustomerService from '../../services/customer';

const getCustomers = async (req: Request, res: Response) => {
    const { desde } = req.query
    try {
        const result = await CustomerService.getCustomers(Number(desde))
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}

const getCustomer = async (req: Request, res: Response) => {
    const { id } = req.params
    console.log('llega controlers')
    try {
        const result = await CustomerService.getCustomer(id)
        res.json(result)
    } catch (error) {
        console.log(error)
        res.status(400).json(error)
    }
}
const getCustomerRuc = async (req: Request, res: Response) => {
    const { ruc } = req.params
    try {
        const result = await CustomerService.getCustomerRuc(ruc)
        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}


const addCustomer = async (req: Request<{}, {}, IAddUpdateCustomer>, res: Response) => {
    const data = req.body

    try {
        const result = await CustomerService.addCustomer(data)

        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}

const updateCustomer = async (req: Request<{ id: string }, {}, IAddUpdateCustomer>, res: Response) => {
    const { id } = req.params
    const data = req.body

    try {
        const result = await CustomerService.updateCustomer(id, data)

        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}

const deleteCustomer = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const result = await CustomerService.deleteCustomer(id)

        res.json(result)
    } catch (error) {
        res.status(400).json(error)
    }
}

export { addCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer ,getCustomerRuc}

