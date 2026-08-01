import { DataSource } from 'typeorm';
import { RolUsuario, Usuario } from '../models/usuarios';
import { Cliente, TipoCliente } from '../models/clientes';
import { Factura } from '../models/facturas';
import { TipoIngreso, Transaccion } from '../models/trasacciones';
import { Auditoria } from '../models/auditoria';
import { ConfiguracionJunta } from '../models/configuracionJunta';
import { Lectura } from '../models/lecturas';
import { EventoAuditoria } from '../models/eventoAuditoria';
import { CierreCaja } from '../models/cierreCaja';
import { PlanPago } from '../models/planPago';
import { Junta } from '../models/junta';
import { InitSchema1740000000000 } from '../migrations/1740000000000-InitSchema';
import { SeedBaselineData1740000001000 } from '../migrations/1740000001000-SeedBaselineData';
import { Phase0Schema1740000002000 } from '../migrations/1740000002000-Phase0Schema';
import { Phase1Schema1740000003000 } from '../migrations/1740000003000-Phase1Schema';
import { Phase2RolesOficina1740000004000 } from '../migrations/1740000004000-Phase2RolesOficina';
import { Phase2PagosParcialesPlanes1740000004100 } from '../migrations/1740000004100-Phase2PagosParcialesPlanes';
import { Phase2MoraVencimiento1740000004200 } from '../migrations/1740000004200-Phase2MoraVencimiento';
import { Phase2PlantillaBoleta1740000004300 } from '../migrations/1740000004300-Phase2PlantillaBoleta';
import { Phase2MultiJunta1740000004400 } from '../migrations/1740000004400-Phase2MultiJunta';
import { Phase3PlanesCobroReverso1740000004500 } from '../migrations/1740000004500-Phase3PlanesCobroReverso';
import { Phase3BoletaBasica1740000004600 } from '../migrations/1740000004600-Phase3BoletaBasica';

require('dotenv').config({ path: '.env' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    Usuario,
    Cliente,
    TipoCliente,
    RolUsuario,
    Factura,
    Transaccion,
    TipoIngreso,
    Auditoria,
    ConfiguracionJunta,
    Lectura,
    EventoAuditoria,
    CierreCaja,
    PlanPago,
    Junta,
  ],
  migrations: [
    InitSchema1740000000000,
    SeedBaselineData1740000001000,
    Phase0Schema1740000002000,
    Phase1Schema1740000003000,
    Phase2RolesOficina1740000004000,
    Phase2PagosParcialesPlanes1740000004100,
    Phase2MoraVencimiento1740000004200,
    Phase2PlantillaBoleta1740000004300,
    Phase2MultiJunta1740000004400,
    Phase3PlanesCobroReverso1740000004500,
    Phase3BoletaBasica1740000004600,
  ],
  migrationsTableName: 'migrations',
});
