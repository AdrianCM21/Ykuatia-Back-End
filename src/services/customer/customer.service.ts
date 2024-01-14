import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
import ICustomer from '../../interfaces/customer/AddUpdateCustomer';
import { AppDataSource } from '../../config/db.config';
import { Cliente ,TipoCliente} from '../../models/db-models/clientes';
const RepositorioClientes = AppDataSource.getRepository(Cliente)
const RepositorioTipoClientes = AppDataSource.getRepository(TipoCliente)
const getClientes = (desde:number): Promise<{resultado:Cliente[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {
            const [result, resultCout] = await RepositorioClientes.findAndCount(
                {where:{delete:false},skip:desde,take:30, relations: ['tipoCliente']}
            )
            if (result.length) {
                resolve({'resultado':result,'total':resultCout})
            } else {
                reject({
                    success: 'error'
                })
            }
        } catch (error) {
            reject(error)
        }
        
    })
}

 const addCliente = async (data: IAddUpdateCustomer) => {
    return new Promise(async(resolve, reject) => {
        try {
            const tipoCliente = await RepositorioTipoClientes.findOneBy({id_tipo:Number(data.tipoCliente)})
            if(!tipoCliente){
                reject('El tipo de cliente no existe')
                return
            }
            const addCliente = new Cliente()
            addCliente.cedula=data.cedula
            addCliente.nombre=data.nombre
            addCliente.direccion=data.direccion
            addCliente.telefono=data.telefono
            addCliente.tipoCliente=tipoCliente
            const result = await AppDataSource.manager.save(addCliente)
            console.log(result)
            resolve(result)
        } catch (error) {
            reject(error)
        }
    })
}

const updateCliente = async (id: string, data: IAddUpdateCustomer) => {

    return new Promise(async(resolve, reject) => {
        try {
            const clienteUpdate = await RepositorioClientes.findOneBy({id:Number(id)})
            const tipoCliente = await RepositorioTipoClientes.findOneBy({id_tipo:Number(data.tipoCliente)})
            if(!tipoCliente){
                reject('El tipo de cliente no existe')
                return
            }
            if(clienteUpdate){
                clienteUpdate.cedula = data.cedula
                clienteUpdate.nombre = data.nombre
                clienteUpdate.direccion = data.direccion
                clienteUpdate.telefono = data.telefono
                clienteUpdate.tipoCliente = tipoCliente
                const result = await AppDataSource.manager.save(clienteUpdate)
                resolve(result)
            }else{
                reject()
            }
            
        } catch (error) {
            reject(error)
        }
    })
}

const deleteCliente = async (id: string) => {
    return new Promise(async(resolve, reject) => {
        try {
            let clienteDelete = await RepositorioClientes.findBy({id:Number(id)})
            if (clienteDelete.length) {
                clienteDelete[0].delete=true
                await AppDataSource.manager.save(clienteDelete)

                resolve({"success":'Eliminado correctamente'})
            } else {
                reject({
                    success: 'error'
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

const getCustomerTypes = async () => {
    return new Promise(async(resolve, reject) => {
        try {
            const result = await AppDataSource.manager.find(TipoCliente)
            if (result.length) {
                resolve(result)
            } else {
                reject({
                    success: 'error'
                })
            }
        } catch (error) {
            reject(error)
        }
    })

}
export { addCliente,getClientes, updateCliente,deleteCliente,getCustomerTypes}