import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
import ICustomer from '../../interfaces/customer/AddUpdateCustomer';
import { AppDataSource } from '../../config/db.config';
import { Cliente } from '../../models/db-models/clientes';
const RepositorioClientes = AppDataSource.getRepository(Cliente)
const getClientes = (desde:number): Promise<{resultado:Cliente[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {
            const [result, resultCout] = await RepositorioClientes.findAndCount(
                {where:{delete:false},skip:desde,take:30}
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

// const getCustomer = async (id: string): Promise<ICustomer[]> => {
//     return new Promise(async(resolve, reject) => {
//         try {
//             let result = await RepositorioUsuarios.findBy({id:Number(id)})
//             if (result.length) {
//                 resolve(result)
//             } else {
//                 reject({
//                     success: 'error'
//                 })
//             }
//             resolve(result)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }
// const getCustomerRuc = async (ruc: string): Promise<ICustomer[]> => {
//     return new Promise(async(resolve, reject) => {
//         try {
//             let result = await RepositorioUsuarios.findBy({ruc:ruc})
//             if (result.length) {
//                 resolve(result)
//             } else {
//                 reject({
//                     success: 'error'
//                 })
//             }
//             resolve(result)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

 const addCliente = async (data: IAddUpdateCustomer) => {
    return new Promise(async(resolve, reject) => {
        const addCliente = new Cliente()
        try {
            addCliente.cedula=data.cedula
            addCliente.nombre=data.nombre
            addCliente.direccion=data.direccion
            addCliente.telefono=data.telefono
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
            if(clienteUpdate){
            clienteUpdate.cedula=data.cedula
            clienteUpdate.nombre=data.nombre
            clienteUpdate.direccion=data.direccion
            clienteUpdate.telefono=data.telefono
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

export { addCliente,getClientes,
     updateCliente,deleteCliente
     //, getCustomer, ,getCustomerRuc
}