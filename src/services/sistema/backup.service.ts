import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runDatabaseBackup = async (): Promise<{ message: string; stdout: string }> => {
  if (process.env.BACKUP_ENABLED !== 'true') {
    throw new Error('Backup deshabilitado. Configurá BACKUP_ENABLED=true');
  }
  const script = path.join(process.cwd(), 'scripts', 'backup-db.sh');
  const { stdout, stderr } = await execFileAsync('bash', [script], {
    env: process.env,
    cwd: process.cwd(),
  });
  return {
    message: 'Backup ejecutado',
    stdout: `${stdout}\n${stderr}`.trim(),
  };
};
