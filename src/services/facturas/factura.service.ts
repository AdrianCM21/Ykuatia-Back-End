import { AppDataSource } from '../../config/db.config';
import { IDataPdf } from '../../interfaces/facturas/pdf';
import { Cliente } from '../../models/clientes';
import { Factura } from '../../models/facturas';
import { formateoMes } from '../../utils/formateoFechas';
import { appendAuditoria } from '../auditoria/auditoria.service';
const RepositorioClientes = AppDataSource.getRepository(Cliente)
const RepositorioFacturas = AppDataSource.getRepository(Factura)
const getFacturas = (desde:number): Promise<{resultado:Factura[],total:number}> => {
    return new Promise(async (resolve, reject) => {
        try {
            const config = {
                where:{delete:false},
                skip:desde,
                take:30,
                relations: ['cliente']}
            const [result, resultCout] = await RepositorioFacturas.findAndCount(config)
            if (result) {
                resolve({'resultado':result,'total':resultCout})
            }
        } catch (error) {
            reject(error)
        }
        
    })
}

const completadoConsumoService = async (id:string,consumo:string):Promise<Factura |null> => {
    try{
        const config = {
            where:{
                id:Number(id)
            },
            relations: ['cliente', 'cliente.tipoCliente'] 
        }
        
        const factura = await RepositorioFacturas.findOne(config)
        if(!factura){
            return null
        }
        factura.estado = 'pendiente a pago'
        factura.consumo = Number(consumo)
        factura.monto = Number(consumo) * factura.cliente.tipoCliente.tarifa
        const result=await RepositorioFacturas.save(factura)
        return result
    

    }catch (error){
        throw error
    }
  
}



const filtrarClientesConFacturas = (clientes:Cliente[]) => {
    return clientes.filter(cliente => cliente.factura && cliente.factura.length > 0 &&  cliente.factura.some(factura => factura.estado === 'pendiente a pago')).map(cliente => {return{cliente,'facturas':cliente.factura}});
};

const filtrarFacturasPendientes = (clientesConFacturas:IDataPdf[]) => {
    return clientesConFacturas.map(cliente => {
        return {
            cliente: cliente.cliente,
            'facturas': cliente.facturas.filter(factura => factura.estado === 'pendiente a pago')
        };
    });
};
const obtenerClientes = async ():Promise<Cliente[]|null> => {
    const cliente= await RepositorioClientes.find({
        relations: ["tipoCliente","factura"],
        where:{delete:false}
     });
    if(!cliente){
        return null
    }
    return cliente
};

const obtenerCliente = async (id:string):Promise<Cliente[]|null> => {

    const cliente = await RepositorioClientes.findOne({ 
        where: { id: Number(id),delete:false },
        relations: ["tipoCliente", "factura"]
    });
    if(!cliente){
        return null
    }
    return [cliente]
};
 

const pagoFactura = async (idFactura:number):Promise<Factura|null> => {
    try{
        const config = {
            where:{
                id:idFactura
            },
            relations: ['cliente', 'cliente.auditoria']

        }
        
        const factura = await RepositorioFacturas.findOne(config)
        if(!factura){
            return null
        }
        factura.estado = 'pagado'
        const result=await RepositorioFacturas.save(factura)
        await appendAuditoria(result.cliente.auditoria.id, `Se pago la factura mes de ${formateoMes(result.Fecha_emicion)}`)
        return result
    

    }catch (error){
        throw error
    }

}
export { getFacturas,obtenerClientes,filtrarClientesConFacturas,filtrarFacturasPendientes,obtenerCliente,completadoConsumoService,pagoFactura}