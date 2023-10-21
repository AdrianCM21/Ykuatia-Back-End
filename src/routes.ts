import { Express } from 'express';
import CreateCustomerRequest from './requests/CreateCustomerRequest';
import * as AuthController from './controllers/auth/loginController';
import * as ClienteController from './controllers/customer/index';
import guard from 'express-jwt-permissions';
import { UserRole } from './enum/userRoles';
import {  Request } from 'express';
import jwt from 'jsonwebtoken'; // Utiliza el módulo jsonwebtoken para decodificar el token


const decodeTokenMiddleware = (req: Request, res, next) => {
  const token = req.header('Authorization'); // Asumiendo que el token se pasa en el encabezado 'Authorization'

  if (token) {
    try {
      console.log(token)
      const decoded = jwt.verify(token, process.env.MI_CLAVESECRETA?process.env.MI_CLAVESECRETA:"os");
      console.log(decoded)
      req.user = decoded; // Almacena la información del usuario decodificada en el objeto de solicitud req.user
      next();
    } catch (error) {
      console.log(error)
      res.status(401).json({ message: 'Token inválido' });
    }
  } else {
    res.status(401).json({ message: 'Token no proporcionado' });
  }
};

const routes = (app: Express) => {
  
  // Middleware para proteger rutas con permisos
  const checkAdminPermissions = guard({
    requestProperty: 'user',
    permissionsProperty: 'roles',
  }).check(UserRole.ADMIN);

  // Usuarios
  app.post('/api/login', AuthController.login);

  // Middleware para proteger rutas con permisos 'admin'
  app.use('/api/admin', checkAdminPermissions);

  // Clientes
  app.post('/api/cliente', CreateCustomerRequest,decodeTokenMiddleware, checkAdminPermissions, ClienteController.addCliente);
  app.get('/api/cliente', decodeTokenMiddleware,checkAdminPermissions, ClienteController.getClientes);
  app.put('/api/cliente/:id', CreateCustomerRequest, checkAdminPermissions, ClienteController.updateCliente);
  app.delete('/api/cliente/:id', checkAdminPermissions, ClienteController.deleteCliente);
};

export default routes;
