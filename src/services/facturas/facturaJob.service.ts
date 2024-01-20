import { AppDataSource } from "../../config/db.config"
import { Cliente } from "../../models/clientes"
import { Factura } from "../../models/facturas"
import { formateoMes } from "../../utils/formateoFechas"
import { appendAuditoria, newAuditoria } from "../auditoria/auditoria.service"

const ClienteRepositorio = AppDataSource.getRepository(Cliente)
const FacturaRepositorio = AppDataSource.getRepository(Factura)

const generacionFacturaTarifaFija = async (cliente:Cliente):Promise<void> => {
  try {
    const idAuditoria= await newAuditoria("factura")
    const factura = new Factura()
    factura.cliente=cliente
    factura.monto=cliente.tipoCliente.tarifa
    factura.estado="pendiente a pago"
    await FacturaRepositorio.save(factura)
    await appendAuditoria(idAuditoria,`Se genero la factura a ${cliente.nombre}, mes ${formateoMes(factura.Fecha_emicion)} `)
  } catch (error) {
    console.error("Error al generar la factura:", error)
    throw error
  }
}

const generacionFacturaTarifaVariable = async (cliente:Cliente):Promise<void> => {
  try {
    const factura = new Factura()
    factura.cliente=cliente
    factura.monto=0
    factura.estado="pendiente a carga de consumo"
    await FacturaRepositorio.save(factura)
  } catch (error) {
    console.error("Error al generar la factura:", error)
    throw error
  }

}

const controlClienteTarifaFija = async ():Promise<void> => {
  try {
    const clientes = await ClienteRepositorio.find({ relations: ["tipoCliente"] })
    for (const cliente of clientes) {
      const tipoTarifa = cliente.tipoCliente.descripcion
      if(tipoTarifa === "Tarifa fija"){
        await generacionFacturaTarifaFija(cliente)
      }else{
        await generacionFacturaTarifaVariable(cliente)
      }
    }
  } catch (error) {
    console.error("Error en el control de clientes:", error)
    throw error
  }
}
 export { controlClienteTarifaFija}