export default interface IAddUpdateCustomer {
    cedula: string
    nombre: string
    telefono: string
    direccion:string
    tipoCliente:number
    locacion:string
    nro_medidor?: string | null
}