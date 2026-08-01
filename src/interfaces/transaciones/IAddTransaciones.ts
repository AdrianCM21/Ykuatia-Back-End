export default interface IAddTransacion {
  monto: string;
  motivo: string;
  tipo_transacion: string;
  id_factura?: number;
}
