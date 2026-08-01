const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_DATABASE', 'MI_CLAVESECRETA'] as const;

export const validateEnv = (): void => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}. Revisá el archivo .env`
    );
  }
};
