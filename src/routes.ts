import { Express } from 'express';
import CreateCustomerRequest from './requests/CreateCustomerRequest';
import * as AuthController from './controllers/auth/loginController';
import * as ClienteController from './controllers/customer/customers.controller';
import * as FacturaController from './controllers/facturas/facturas.controller';



const routes = (app: Express) => {

  // Usuarios
  app.post('/api/login', AuthController.login);

  // Clientes
  app.get('/api/cliente',  ClienteController.getClientes);
  app.get('/api/clientetipo',  ClienteController.getCustomerTypes);
  app.post('/api/cliente', CreateCustomerRequest,ClienteController.addCliente);
  app.put('/api/cliente/:id', CreateCustomerRequest,  ClienteController.updateCliente);
  app.delete('/api/cliente/:id',  ClienteController.deleteCliente);

  // Facturas
  app.get('/api/facturas',  FacturaController.getFacturasController);
  app.get('/api/facturas/descargar',  FacturaController.descargarFactura);
  app.post('/api/facturas/:id',  FacturaController.completadoFacturaConsumo);

};

export default routes;
