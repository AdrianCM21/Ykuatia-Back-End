import { AppDataSource } from '../../config/db.config';
import { Factura } from '../../models/db-models/facturas';
const RepositorioFacturas = AppDataSource.getRepository(Factura)
export const getFacturas = (desde:number): Promise<{resultado:Factura[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {
            const [result, resultCout] = await RepositorioFacturas.findAndCount(
                {where:{delete:false},skip:desde,take:30, relations: ['cliente']}
            )
            if (result) {
                resolve({'resultado':result,'total':resultCout})
            }
        } catch (error) {
            reject(error)
        }
        
    })
}