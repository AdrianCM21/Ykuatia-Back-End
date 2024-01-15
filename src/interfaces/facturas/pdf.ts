import { Cliente } from "../../models/db-models/clientes";
import { Factura } from "../../models/db-models/facturas";

export interface IDataPdf{
    cliente:Cliente
    facturas:Factura[]
}