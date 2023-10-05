import { Express } from 'express';
import CreateCustomerRequest from "./requests/CreateCustomerRequest"
import * as CustomerController from './controllers/customer';

const routes = (app: Express) => {
  // Usuarios
    app.get('/api/user', CustomerController.getCustomers)
    app.get('/api/user/:id', CustomerController.getCustomer)
    app.post('/api/user', CreateCustomerRequest,CustomerController.addCustomer)
    app.delete('/api/user/:id', CustomerController.deleteCustomer)


}

export default routes