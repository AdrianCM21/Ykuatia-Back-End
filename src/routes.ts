import { Express } from 'express';
import CreateCustomerRequest from './requests/CreateCustomerRequest';
import * as AuthController from './controllers/auth/loginController';
import * as ClienteController from './controllers/customer/customers.controller';
import * as FacturaController from './controllers/facturas/facturas.controller';
import {
  addTransacionController,
  getCajaResumenController,
  getTransacionesController,
} from './controllers/transacion/transacion.controlle';
import {
  getConfiguracionesController,
  updateConfiguracionesController,
} from './controllers/configuraciones/configuraciones.controller';
import {
  boletaPreviewController,
  deleteLogoController,
  getJuntaController,
  updateJuntaController,
  uploadLogoController,
} from './controllers/junta/junta.controller';
import {
  createUsuarioController,
  deleteUsuarioController,
  getUsuariosController,
  resetPasswordController,
  updateUsuarioController,
} from './controllers/usuarios/usuarios.controller';
import {
  exportMorososController,
  getDashboardController,
  getMorososController,
  getResumenController,
} from './controllers/reportes/reportes.controller';
import { getEventosController } from './controllers/auditoria/eventos.controller';
import {
  crearCierreController,
  exportCierreController,
  listCierresController,
  reabrirCierreController,
} from './controllers/caja/cierre.controller';
import { backupController } from './controllers/sistema/sistema.controller';
import {
  createPlanController,
  listPlanesController,
  updatePlanController,
} from './controllers/planes/planes.controller';
import { listJuntasController } from './controllers/juntas/juntas.controller';
import verifyWebToken from './middlewares/verifyWebToken';
import requireRole from './middlewares/requireRole';
import {
  ROLES_CAJERO,
  ROLES_OFICINA_O_CAMPO,
  ROLES_PRESIDENTE,
  ROLES_TESORERO,
} from './enum/userRoles';
import { logoUpload } from './config/upload.config';
import { UpdateJuntaRequest } from './requests/JuntaRequest';
import {
  CreateUsuarioRequest,
  ResetPasswordRequest,
  UpdateUsuarioRequest,
} from './requests/UsuarioRequest';
import { AddCajaRequest } from './requests/CajaRequest';
import { PagoFacturaRequest, RevertirAbonoRequest } from './requests/PagoRequest';
import { CreatePlanPagoRequest, UpdatePlanPagoRequest } from './requests/PlanPagoRequest';

const routes = (app: Express) => {
  app.post('/api/login', AuthController.login);

  app.use(verifyWebToken);

  // Lectura compartida oficina + campo
  app.get('/api/cliente', requireRole(...ROLES_OFICINA_O_CAMPO), ClienteController.getClientes);
  app.get(
    '/api/facturas',
    requireRole(...ROLES_OFICINA_O_CAMPO),
    FacturaController.getFacturasController
  );
  app.get('/api/facturas/descargar', requireRole(...ROLES_CAJERO), FacturaController.descargarFactura);
  app.get('/api/facturas/recibo', requireRole(...ROLES_CAJERO), FacturaController.descargarRecibo);
  app.post('/api/facturas/generar-mes', requireRole(...ROLES_PRESIDENTE), FacturaController.generarMesController);
  app.post(
    '/api/facturas/:id',
    requireRole(...ROLES_OFICINA_O_CAMPO),
    FacturaController.completadoFacturaConsumo
  );

  app.get('/api/clientetipo', requireRole(...ROLES_PRESIDENTE), ClienteController.getCustomerTypes);
  app.post('/api/cliente', requireRole(...ROLES_PRESIDENTE), CreateCustomerRequest, ClienteController.addCliente);
  app.put(
    '/api/cliente/:id',
    requireRole(...ROLES_PRESIDENTE),
    CreateCustomerRequest,
    ClienteController.updateCliente
  );
  app.get('/api/clientefactura', requireRole(...ROLES_CAJERO), ClienteController.getClientesConFactura);
  app.get('/api/cliente/:id/lecturas', requireRole(...ROLES_CAJERO), ClienteController.getLecturasCliente);
  app.delete('/api/cliente/:id', requireRole(...ROLES_PRESIDENTE), ClienteController.deleteCliente);

  app.post(
    '/api/facturapagos',
    requireRole(...ROLES_CAJERO),
    PagoFacturaRequest,
    FacturaController.pagoFacturaController
  );
  app.post(
    '/api/facturapagos/revertir',
    requireRole(...ROLES_CAJERO),
    RevertirAbonoRequest,
    FacturaController.revertirAbonoController
  );
  app.get(
    '/api/facturapagos/movimientos',
    requireRole(...ROLES_CAJERO),
    FacturaController.listMovimientosPagoController
  );

  app.get('/api/planes-pago', requireRole(...ROLES_CAJERO), listPlanesController);
  app.post(
    '/api/planes-pago',
    requireRole(...ROLES_CAJERO),
    CreatePlanPagoRequest,
    createPlanController
  );
  app.put(
    '/api/planes-pago/:id',
    requireRole(...ROLES_CAJERO),
    UpdatePlanPagoRequest,
    updatePlanController
  );

  app.get('/api/caja/resumen', requireRole(...ROLES_TESORERO), getCajaResumenController);
  app.get('/api/caja/cierres', requireRole(...ROLES_TESORERO), listCierresController);
  app.post('/api/caja/cierres', requireRole(...ROLES_TESORERO), crearCierreController);
  app.get('/api/caja/cierres/:id/export.csv', requireRole(...ROLES_TESORERO), exportCierreController);
  app.post('/api/caja/cierres/:id/reabrir', requireRole(...ROLES_PRESIDENTE), reabrirCierreController);
  app.get('/api/caja', requireRole(...ROLES_TESORERO), getTransacionesController);
  app.post('/api/caja', requireRole(...ROLES_TESORERO), AddCajaRequest, addTransacionController);

  app.get('/api/reportes/morosos', requireRole(...ROLES_TESORERO), getMorososController);
  app.get('/api/reportes/morosos/export.csv', requireRole(...ROLES_TESORERO), exportMorososController);
  app.get('/api/reportes/resumen', requireRole(...ROLES_TESORERO), getResumenController);
  app.get('/api/reportes/dashboard', requireRole(...ROLES_TESORERO), getDashboardController);

  app.get('/api/auditoria', requireRole(...ROLES_TESORERO), getEventosController);
  app.post('/api/sistema/backup', requireRole(...ROLES_PRESIDENTE), backupController);

  app.get('/api/configuraciones', requireRole(...ROLES_PRESIDENTE), getConfiguracionesController);
  app.put('/api/configuraciones', requireRole(...ROLES_PRESIDENTE), updateConfiguracionesController);

  app.get('/api/junta', requireRole(...ROLES_PRESIDENTE), getJuntaController);
  app.put('/api/junta', requireRole(...ROLES_PRESIDENTE), UpdateJuntaRequest, updateJuntaController);
  app.post(
    '/api/junta/logo',
    requireRole(...ROLES_PRESIDENTE),
    logoUpload.single('logo'),
    uploadLogoController
  );
  app.delete('/api/junta/logo', requireRole(...ROLES_PRESIDENTE), deleteLogoController);
  app.post('/api/junta/boleta-preview', requireRole(...ROLES_PRESIDENTE), boletaPreviewController);

  app.get('/api/juntas', requireRole(...ROLES_PRESIDENTE), listJuntasController);

  app.get('/api/usuarios', requireRole(...ROLES_PRESIDENTE), getUsuariosController);
  app.post('/api/usuarios', requireRole(...ROLES_PRESIDENTE), CreateUsuarioRequest, createUsuarioController);
  app.put('/api/usuarios/:id', requireRole(...ROLES_PRESIDENTE), UpdateUsuarioRequest, updateUsuarioController);
  app.put(
    '/api/usuarios/:id/password',
    requireRole(...ROLES_PRESIDENTE),
    ResetPasswordRequest,
    resetPasswordController
  );
  app.delete('/api/usuarios/:id', requireRole(...ROLES_PRESIDENTE), deleteUsuarioController);
};

export default routes;
