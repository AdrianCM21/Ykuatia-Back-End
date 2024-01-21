import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
// import ICustomer from '../../interfaces/customer/AddUpdateCustomer'
import { AppDataSource } from '../../config/db.config';
import { Cliente ,TipoCliente} from '../../models/clientes';
import { Auditoria } from '../../models/auditoria';
import { TipoIngreso, Transaccion } from '../../models/trasacciones';
import IAddUpdateTransacion from '../../interfaces/customer/AddUpdateCustomer';
import IAddTransacion from '../../interfaces/transaciones/IAddTransaciones';
const RepositorioTransaciones= AppDataSource.getRepository(Transaccion)
const RepositorioOperaciones= AppDataSource.getRepository(TipoIngreso)




export const getTransaciones = (desde:number): Promise<{resultado:Transaccion[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {

            const config = {
                where:{delete:false},
                skip:desde,
                take:30,
                relations: ['tipo_ingreso']
            }
            const [result, resultCout] = await RepositorioTransaciones.findAndCount(config)
            resolve({'resultado':result,'total':resultCout})
        } catch (error) {
            reject(error)
        }
        
    })
}


export  const addTransaciones = async (data: IAddTransacion):Promise<Transaccion> => {
    return new Promise(async(resolve, reject) => {
        try {
            const tipo= await findTipoOperacion(Number(data.tipo_transacion))
            const addTransacion  =new Transaccion()
            addTransacion.monto=Number(data.monto)
            addTransacion.motivo=data.motivo
            addTransacion.tipo_ingreso=tipo

            const result = await AppDataSource.manager.save(addTransacion )
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}
const findTipoOperacion = async (id: number) => {
    const tipoCliente = await RepositorioOperaciones.findOneBy({id});
    if (!tipoCliente) {
        throw new Error('El tipo de transacion no existe');
    }
    return tipoCliente;
};

