# Backup y restore — Ykuatia

## Backup automático

Script: `scripts/backup-db.sh`

Requisitos: `mysqldump`, `gzip`, variables en `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`).

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

Salida: `backups/ykuatia-YYYYMMDD-HHMM.sql.gz`  
Retención: `BACKUP_RETENTION_DAYS` (default 14).

### Cron (Linux)

```cron
30 2 * * * cd /ruta/Ykuatia-Back-End && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

### Desde API (opcional)

Con `BACKUP_ENABLED=true` en `.env`:

```http
POST /api/sistema/backup
Authorization: Bearer <token admin>
```

## Restore

1. Detener la API.
2. Restaurar:

```bash
gunzip -c backups/ykuatia-YYYYMMDD-HHMM.sql.gz | mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_DATABASE"
```

3. Verificar migraciones:

```bash
npm run migration:show
```

4. Reiniciar la API y validar login + listados clave (clientes, caja, facturas).
