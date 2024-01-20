import { Cliente } from "../../models/clientes";
import { Factura } from "../../models/facturas";

export interface IDataPdf{
    cliente:Cliente
    facturas:Factura[]
}