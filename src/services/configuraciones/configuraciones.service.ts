
import { AppDataSource } from '../../config/db.config';
import IUpdateConfig from '../../interfaces/configuraciones/UpdateConfig';
import {TipoCliente} from '../../models/clientes';
const RepositorioConfiguraciones= AppDataSource.getRepository(TipoCliente)



export const getConfiguraciones = (): Promise<TipoCliente[]> => {
    return new Promise(async (resolve, reject) => {
        try {

            const result = await RepositorioConfiguraciones.find()
            resolve(result)
        } catch (error) {
            reject(error)
        }
        
    })
}

export const updateConfiguraciones = (data:IUpdateConfig): Promise<TipoCliente[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const Update = await RepositorioConfiguraciones.find()
            if(Update.length>1){
                Update[0].tarifa=data.precioFijo
                Update[1].tarifa=data.precioPorLitro
                const result = await AppDataSource.manager.save(Update )
                resolve(result)
            }else{
                reject()
            }
            
        } catch (error) {
            reject(error)
        }
        
    })
}



