import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './utils/validateEnv';
validateEnv();

import app from './app';
import { AppDataSource } from './config/db.config';

const PORT = Number(process.env.PORT) || 3000;

const main = async () => {
  await AppDataSource.initialize();
  const executed = await AppDataSource.runMigrations();

  if (executed.length > 0) {
    console.log(`Migraciones aplicadas: ${executed.map((m) => m.name).join(', ')}`);
  } else {
    console.log('Base de datos al día (sin migraciones pendientes)');
  }

  app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`);
  });
};

main().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
