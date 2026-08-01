import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes';
import { facturasCron } from './jobs/Facturas';
import { ensureUploadDirs, UPLOADS_ROOT } from './config/upload.config';

const app = express();

ensureUploadDirs();
facturasCron.start();

app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors());
app.use('/uploads', express.static(UPLOADS_ROOT));

routes(app);

// @ts-ignore
global.__basedir = __dirname;

export default app;
