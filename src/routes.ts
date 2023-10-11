import { Express } from 'express';
import CreateCustomerRequest from "./requests/CreateCustomerRequest"
import * as AuthController from './controllers/auth/loginController';

const routes = (app: Express) => {
  // Usuarios
    app.post('/api/login', AuthController.login)


}

export default routes