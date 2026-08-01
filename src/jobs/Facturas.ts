import { schedule } from 'node-cron';
import { controlFacturas } from '../controllers/facturas/facturas.controller';

// Día 1 de cada mes a las 00:00 (America/Asuncion)
export const facturasCron = schedule('0 0 1 * *', controlFacturas, {
  timezone: 'America/Asuncion',
});
