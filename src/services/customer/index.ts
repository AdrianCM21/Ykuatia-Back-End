// import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
// import ICustomer from '../../interfaces/customer/AddUpdateCustomer';
// import { AppDataSource } from '../../config/db.config';
// import { usuarios } from '../../models/db-models/usuarios';
// const RepositorioUsuarios = AppDataSource.getRepository(usuarios)
// const getCustomers = (desde:number): Promise<{resultado:usuarios[],total:number}> => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             const [result, resultCout] = await RepositorioUsuarios.findAndCount(
//                 {skip:desde,take:30}
//             )
//             if (result.length) {
//                 resolve({'resultado':result,'total':resultCout})
//             } else {
//                 reject({
//                     success: 'error'
//                 })
//             }
//         } catch (error) {
//             reject(error)
//         }
        
//     })
// }

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

// const addCustomer = async (data: IAddUpdateCustomer) => {
//     return new Promise(async(resolve, reject) => {
//         const addUsuarios = new usuarios()
//         try {
//             addUsuarios.ruc=data.ruc
//             addUsuarios.razon_social=data.razon_social
//             addUsuarios.nombre_fantasia=data.nombre_fantasia
//             addUsuarios.telefono=data.telefono
//             addUsuarios.celular=data.celular
//             addUsuarios.direccion=data.direccion
//             addUsuarios.email=data.email
//             addUsuarios.departamento=data.departamento
//             addUsuarios.ciudad=data.ciudad
//             addUsuarios.distrito=data.distrito
//             const result = await AppDataSource.manager.save(addUsuarios)
//             resolve(result)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

// const updateCustomer = async (id: string, data: IAddUpdateCustomer) => {

//     return new Promise(async(resolve, reject) => {
//         try {
//             const clienteUpdate = await RepositorioUsuarios.findOneBy({id:Number(id)})
//             clienteUpdate!.ruc=data.ruc
//             clienteUpdate!.razon_social=data.razon_social
//             clienteUpdate!.nombre_fantasia=data.nombre_fantasia
//             clienteUpdate!.telefono=data.telefono
//             clienteUpdate!.celular=data.celular
//             clienteUpdate!.direccion=data.direccion
//             clienteUpdate!.email=data.email
//             clienteUpdate!.departamento=data.departamento
//             clienteUpdate!.ciudad=data.ciudad
//             clienteUpdate!.distrito=data.distrito

//             const result = await AppDataSource.manager.save(clienteUpdate)
            
//             resolve(result)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

// const deleteCustomer = async (id: string) => {
//     return new Promise(async(resolve, reject) => {
//         try {
//             const deleteCliente = await RepositorioUsuarios.findOneBy({id:Number(id)})
//             //@ts-ignore
//             const result = await RepositorioUsuarios.remove(deleteCliente)
//             resolve(result)
//         } catch (error) {
//             reject(error)
//         }
//     })
// }

// export { addCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer ,getCustomerRuc}