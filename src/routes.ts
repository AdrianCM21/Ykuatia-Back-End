import { Express } from 'express';
import CreateCustomerRequest from './requests/CreateCustomerRequest';
import * as AuthController from './controllers/auth/loginController';
import * as ClienteController from './controllers/customer/index';



const routes = (app: Express) => {

  // Usuarios
  app.post('/api/login', AuthController.login);

  // Clientes
  app.post('/api/cliente', CreateCustomerRequest,ClienteController.addCliente);
  app.get('/api/cliente',  ClienteController.getClientes);
  app.put('/api/cliente/:id', CreateCustomerRequest,  ClienteController.updateCliente);
  app.delete('/api/cliente/:id',  ClienteController.deleteCliente);
};

export default routes;
