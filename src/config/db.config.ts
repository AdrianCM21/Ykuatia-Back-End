import { DataSource } from "typeorm"
import { RolUsuario, Usuario } from "../models/usuarios"
import { Cliente, TipoCliente } from "../models/clientes";
import { Factura } from "../models/facturas";
import { TipoIngreso, Transaccion } from "../models/trasacciones";
import { Auditoria } from "../models/auditoria";
require('dotenv').config({ path: '.env' });


export const AppDataSource = new DataSource({
    type: "mysql",
    host:process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true,
    logging: false,
    entities: [Usuario,Cliente,TipoCliente,RolUsuario,Factura,Transaccion,TipoIngreso,Auditoria],
})