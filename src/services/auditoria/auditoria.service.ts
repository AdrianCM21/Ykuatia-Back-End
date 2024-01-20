import { AppDataSource } from "../../config/db.config";
import { Auditoria } from "../../models/auditoria";
import { Cliente } from "../../models/clientes";
const RepositorioCliente = AppDataSource.getRepository(Cliente);
const RepositorioAudotoria = AppDataSource.getRepository(Auditoria)

const newAuditoria = async (tipo: string): Promise<number> => {
    try {
        const tiempo = new Date();
        const addAuditoria = new Auditoria();
        addAuditoria.historial_cambios = `${tiempo.toISOString()} - Se inicio auditoria para ${tipo}`;
        const result = await AppDataSource.manager.save(addAuditoria);
        return result.id;
    } catch (error) {
        console.error('Error al crear nueva auditoria:', error);
        throw error; 
    }
};

const getAuditoriaId=(id:number):Promise<number>=>{
    return new Promise(async(resolve, reject) => {
        try {
            const result = await RepositorioCliente.findOneBy({id})
            if (result) {
                resolve(result.auditoria.id)
            }else{
                resolve(0)
            }
        } catch (error) {
            reject(error)
        }
    })
}

const appendAuditoria = async (id:number, accion:string) => {
    try {
        if(id === 0) return 0;
        const tiempo = new Date();
        const value = `; ${tiempo.toISOString()} - ${accion}`;
        const auditoriaUpdate = await RepositorioAudotoria.findOneBy({id});
        if (!auditoriaUpdate) {
            throw new Error('No se encontro la auditoria');
        }
        
        auditoriaUpdate.historial_cambios += value;
        const result = await AppDataSource.manager.save(auditoriaUpdate);
        return result;
    } catch (error) {
        console.error('Error al actualizar auditoria:', error);
        throw error;
    }
};
export {appendAuditoria,newAuditoria,getAuditoriaId}