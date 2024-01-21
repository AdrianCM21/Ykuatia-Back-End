import IAddUpdateCustomer from '../../interfaces/customer/AddUpdateCustomer';
// import ICustomer from '../../interfaces/customer/AddUpdateCustomer'
import { AppDataSource } from '../../config/db.config';
import { Cliente ,TipoCliente} from '../../models/clientes';
import { Auditoria } from '../../models/auditoria';
const RepositorioClientes = AppDataSource.getRepository(Cliente)
const RepositorioAuditorias = AppDataSource.getRepository(Auditoria)
const RepositorioTipoClientes = AppDataSource.getRepository(TipoCliente)


const getClientes = (desde:number): Promise<{resultado:Cliente[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {

            const config = {
                where:{delete:false},
                skip:desde,
                take:30,
                relations: ['tipoCliente','auditoria']
            }
            const [result, resultCout] = await RepositorioClientes.findAndCount(config)
            resolve({'resultado':result,'total':resultCout})
        } catch (error) {
            reject(error)
        }
        
    })
}

const getClientesConFactura = (desde:number): Promise<{resultado:Cliente[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {

            const config = {
                where:{delete:false},
                skip:desde,
                relations: ['factura']
            }
            const result= await RepositorioClientes.find(config)
            const isFacturaPendiente = result.filter((element)=>{
            {return element.factura.some((factura)=>{return factura.estado === 'pendiente a pago'})}})
            const clientesConFacturas  = filtrarFacturasPendientes(isFacturaPendiente);
           
            resolve({'resultado':clientesConFacturas,'total':0})
        } catch (error) {
            reject(error)
        }
        
    })
}

 const addCliente = async (data: IAddUpdateCustomer,idAuditoria:number):Promise<Cliente> => {
    return new Promise(async(resolve, reject) => {
        try {
            const tipoCliente = await findTipoCliente(data.tipoCliente);
            const auditoria = await findAuditoria(idAuditoria);
            const addCliente = new Cliente()
            addCliente.cedula=data.cedula
            addCliente.nombre=data.nombre
            addCliente.direccion=data.direccion
            addCliente.telefono=data.telefono
            addCliente.auditoria=auditoria
            addCliente.tipoCliente=tipoCliente
            addCliente.locacion=data.locacion
            const result = await AppDataSource.manager.save(addCliente)
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
                clienteUpdate.locacion = data.locacion
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
                clienteDelete[0].delete=true
                await AppDataSource.manager.save(clienteDelete)

                resolve({"success":'Eliminado correctamente'})

        } catch (error) {
            reject(error)
        }
    })
}

const getCustomerTypes = async () => {
    return new Promise(async(resolve, reject) => {
        try {
            const result = await AppDataSource.manager.find(TipoCliente)
                resolve(result)
        } catch (error) {
            reject(error)
        }
    })

}

const findTipoCliente = async (id: number) => {
    const tipoCliente = await RepositorioTipoClientes.findOneBy({id_tipo: id});
    if (!tipoCliente) {
        throw new Error('El tipo de cliente no existe');
    }
    return tipoCliente;
};

const findAuditoria = async (id: number) => {
    const auditoria = await RepositorioAuditorias.findOneBy({id});
    if (!auditoria) {
        throw new Error('La auditoria no existe');
    }
    return auditoria;
};

const filtrarFacturasPendientes = (clientesConFacturas:Cliente[]):Cliente[] => {
    const clientes = clientesConFacturas.map(cliente => {
        return {
            ...cliente,
            'factura': cliente.factura.filter(factura => factura.estado === 'pendiente a pago')
        };
    });
    return clientes as Cliente[];
};
export { getClientesConFactura,addCliente,getClientes, updateCliente,deleteCliente,getCustomerTypes}