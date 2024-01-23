import { Express } from 'express';
import CreateCustomerRequest from './requests/CreateCustomerRequest';
import * as AuthController from './controllers/auth/loginController';
import * as ClienteController from './controllers/customer/customers.controller';
import * as FacturaController from './controllers/facturas/facturas.controller';
import { addTransacionController, getTransacionesController } from './controllers/transacion/transacion.controlle';
import { getConfiguracionesController, updateConfiguracionesController } from './controllers/configuraciones/configuraciones.controller';
import verifyWebToken from './middlewares/verifyWebToken';



const routes = (app: Express) => {

  // Usuarios
  app.post('/api/login', AuthController.login);

  app.use(verifyWebToken)

  // Clientes
  app.get('/api/cliente',  ClienteController.getClientes);
  app.get('/api/clientetipo',  ClienteController.getCustomerTypes);
  app.post('/api/cliente', CreateCustomerRequest,ClienteController.addCliente);
  app.put('/api/cliente/:id', CreateCustomerRequest,  ClienteController.updateCliente);
  app.get('/api/clientefactura',  ClienteController.getClientesConFactura)
  app.delete('/api/cliente/:id',  ClienteController.deleteCliente);

  // Facturas
  app.get('/api/facturas',  FacturaController.getFacturasController);
  app.get('/api/facturas/descargar',  FacturaController.descargarFactura);
  app.post('/api/facturas/:id',  FacturaController.completadoFacturaConsumo);
  app.post('/api/facturapagos',  FacturaController.pagoFacturaController);

  // Caja
  app.get('/api/caja',  getTransacionesController);
  app.post('/api/caja', addTransacionController);

  // Configuraciones 
  app.get('/api/configuraciones',  getConfiguracionesController);
  app.put('/api/configuraciones',  updateConfiguracionesController);

};

export default routes;
