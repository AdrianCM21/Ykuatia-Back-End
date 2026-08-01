# Ykuatia Back-End — Documentación técnica

API REST para la gestión operativa de **juntas de saneamiento**: clientes, facturación mensual, cobros, caja, boletas PDF, reportes y auditoría.

| | |
|---|---|
| Stack | Node.js · Express · TypeScript · TypeORM · MySQL |
| Auth | JWT (Bearer) + bcrypt · roles de oficina y campo |
| PDF | pdfmake (boletas / recibos) |
| Tests | Jest + Supertest |

---

## Índice

1. [Requisitos](#requisitos)
2. [Arranque local](#arranque-local)
3. [Variables de entorno](#variables-de-entorno)
4. [Arquitectura](#arquitectura)
5. [Migraciones](#migraciones)
6. [Autenticación y roles](#autenticación-y-roles)
7. [Módulos y endpoints](#módulos-y-endpoints)
8. [Boletas PDF](#boletas-pdf)
9. [Jobs / cron](#jobs--cron)
10. [Scripts útiles](#scripts-útiles)
11. [Tests](#tests)
12. [Convenciones](#convenciones)

---

## Requisitos

- Node.js **18+**
- MySQL **8+** (utf8mb4)
- npm

---

## Arranque local

```bash
# 1) Base vacía
mysql -e "CREATE DATABASE ykuatia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2) Entorno
cp .env.example .env
# Completar DB_* y MI_CLAVESECRETA

npm install
npm run db:setup   # aplica migraciones + seed
npm run dev        # http://localhost:3000 (o PORT del .env)
```

Las migraciones también se ejecutan al iniciar el servidor si hay pendientes.

### Usuario inicial (seed)

| Campo | Valor |
|-------|-------|
| Email | `admin@ykuatia.local` |
| Password | `admin123` |
| Rol | `admin` |

**Cambiar la contraseña en el primer acceso.**

### Datos base del seed

- Roles: `admin`, `presidente`, `tesorero`, `cajero`, `agente de campo` (según migraciones de fase 2+)
- Tipos de cliente / tarifas
- Tipos de caja: egreso / ingreso
- Configuración de junta por defecto

---

## Variables de entorno

Ver [`.env.example`](.env.example).

| Variable | Uso |
|----------|-----|
| `PORT` | Puerto HTTP (default `3000`) |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_DATABASE` | Conexión MySQL |
| `MI_CLAVESECRETA` | Firma JWT |
| `TYPEORM_LOGGING` | `true` para log SQL |
| `NODE_ENV` | `development` / `production` |

---

## Arquitectura

```
src/
├── server.ts          # bootstrap HTTP
├── app.ts             # Express app (middlewares globales)
├── routes.ts          # registro de rutas + guards de rol
├── config/            # DB, uploads, env
├── controllers/       # capa HTTP
├── services/          # lógica de negocio
├── models/            # entidades TypeORM
├── migrations/        # cambios de esquema (única fuente de verdad)
├── requests/          # express-validator
├── middlewares/       # auth JWT, roles
├── jobs/              # cron (facturación mensual)
├── utils/             # helpers reutilizables (mora, PDF data, papel boleta…)
└── tests/             # setup Jest
```

Patrón habitual: **Controller → Service → Repository (TypeORM)**.

`synchronize` de TypeORM está **desactivado**. El esquema solo cambia por migraciones.

---

## Migraciones

| Script | Descripción |
|--------|-------------|
| `npm run db:setup` / `migration:run` | Aplicar pendientes |
| `npm run migration:show` | Ver estado |
| `npm run migration:revert` | Revertir la última |
| `npm run migration:create -- src/migrations/Nombre` | Plantilla vacía |
| `npm run migration:generate -- src/migrations/Nombre` | Diff desde entidades |

**Importante:** toda migración nueva debe registrarse en el array `migrations` de [`src/config/db.config.ts`](src/config/db.config.ts).

Orden conceptual (resumen):

1. `InitSchema` + `SeedBaselineData`
2. Fase 0 — integridad de cobros / caja / junta
3. Fase 1 — mora, plantillas, mensajes legacy
4. Fase 2 — roles oficina, pagos parciales, planes, multi-junta
5. Fase 3 — planes ligados a cobro, reverso de abonos, **boleta básica** (papel / N por hoja)

---

## Autenticación y roles

- `POST /api/login` → `{ token, usuario… }`
- Header: `Authorization: Bearer <jwt>` (o el esquema que use el front con `x-token`)
- Expiración típica: **8h**
- Passwords: **bcrypt**. Usuarios legacy en texto plano: `npm run hash-passwords`

### Roles de acceso (oficina)

| Rol | Alcance típico |
|-----|----------------|
| `admin` / `presidente` | Configuración, usuarios, generación de mes, backup, todo lo operativo |
| `tesorero` | Caja, cierres, reportes, morosos, auditoría |
| `cajero` | Clientes (lectura), facturas, cobros, planes |
| `agente de campo` | Flujos de campo (lecturas / mapa móvil) |

Los guards viven en middlewares + constantes `ROLES_*` en rutas.

---

## Módulos y endpoints

Prefijo base: `/api`.

### Auth
| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/login` | Público |

### Clientes
| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/cliente` | Listado / búsqueda |
| POST / PUT / DELETE | `/cliente` · `/cliente/:id` | Alta / edición / soft delete |
| GET | `/clientefactura` | Clientes con deuda (cobros) |
| GET | `/cliente/:id/lecturas` | Historial de lecturas |
| GET | `/clientetipo` | Tipos / tarifas |

### Facturas y PDFs
| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/facturas/generar-mes` | Emisión manual del mes |
| GET | `/facturas/descargar` | PDF boleta(s) |
| GET | `/facturas/recibo` | PDF recibo de pago |

### Pagos / movimientos
| Método | Ruta | Notas |
|--------|------|--------|
| POST | `/facturapagos` (o ruta de pagos del controller) | Cobro total/parcial; transacción atómica con caja |
| POST | `/facturapagos/revertir` | Reverso de abono |
| GET | `/facturapagos/movimientos` | Últimos abonos |

### Planes de pago
| Método | Ruta | Notas |
|--------|------|--------|
| GET / POST | `/planes-pago` | Listar / crear |
| PUT | `/planes-pago/:id` | Cancelar / actualizar estado |

### Caja
| Método | Ruta | Notas |
|--------|------|--------|
| GET / POST | `/caja` | Movimientos manuales |
| GET | `/caja/resumen` | Totales del período |
| GET / POST | `/caja/cierres` | Cierres de caja |
| GET | `/caja/cierres/:id/export.csv` | Export |
| POST | `/caja/cierres/:id/reabrir` | Solo presidente |

### Reportes y auditoría
| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/reportes/morosos` · `/export.csv` | Aging / export |
| GET | `/reportes/resumen` · `/dashboard` | Indicadores |
| GET | `/auditoria` | Eventos estructurados |
| POST | `/sistema/backup` | Backup disparado por API |

### Configuración
| Método | Ruta | Notas |
|--------|------|--------|
| GET / PUT | `/configuraciones` | Tarifas |
| GET / PUT | `/junta` | Identidad + formato boleta |
| POST | `/junta/logo` | Upload logo |
| POST | `/junta/boleta-preview` | Preview PDF con draft |
| GET / POST / PUT / DELETE | `/usuarios` | ABM usuarios oficina |

> Para el detalle exacto de paths y middlewares, ver [`src/routes.ts`](src/routes.ts).

---

## Boletas PDF

Generación con **pdfmake** en [`src/services/facturas/pdf.service.ts`](src/services/facturas/pdf.service.ts).

### Plantillas (`plantilla_boleta`)

| Valor | Uso |
|-------|-----|
| `clasica` | Una boleta por hoja, layout completo |
| `compacta` | Una por hoja, más densa |
| `formal` | Una por hoja, encabezado institucional |
| `basica` | Varias por hoja (2 o 4), con líneas de corte |

### Opciones asociadas (plantilla básica)

| Campo | Valores | Default |
|-------|---------|---------|
| `papel_boleta` | `a4` · `oficio` | `a4` |
| `boletas_por_pagina` | `2` · `4` | `2` |

Helpers de papel: [`src/utils/boletaPapel.ts`](src/utils/boletaPapel.ts).  
Mapeo factura → datos PDF: [`src/utils/boletaData.ts`](src/utils/boletaData.ts).

---

## Jobs / cron

- Facturación automática: **día 1 de cada mes a las 00:00** (zona horaria del servidor).
- Omite clientes soft-deleted.
- Evita duplicar facturas del mismo cliente/mes (`unique` / control de negocio).

También existe emisión manual: `POST /api/facturas/generar-mes`.

---

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | API con reload |
| `npm test` | Jest con coverage |
| `npm run db:setup` | Migraciones |
| `npm run hash-passwords` | Rehash passwords legacy |
| `scripts/backup-db.sh` | Backup MySQL (ver script) |

Uploads (logos): directorio `uploads/junta/` (multer).

---

## Tests

```bash
npm test
# o suites puntuales:
npx jest --runInBand --coverage=false src/services/__tests__/junta.service.test.ts
```

Cobertura de negocio relevante: pagos, junta/boleta, mora, caja, controllers de facturas.

Setup global: [`src/tests/setup.ts`](src/tests/setup.ts).

---

## Convenciones

1. **No usar `synchronize: true`** en producción ni desarrollo.
2. Toda función utilitaria reutilizable va en `src/utils/`, no en controllers.
3. Validar input con `express-validator` en `src/requests/`.
4. Operaciones de dinero (cobro, reverso, caja) deben ser **transaccionales**.
5. Registrar eventos sensibles vía servicio de auditoría (`junta.actualizar`, cobros, cierres, etc.).
6. Al agregar migración: archivo en `src/migrations/` **+** registro en `db.config.ts`.

---

## Relación con el front

Este API es consumido por **Ykuatia-Front-End** (oficina + vistas de campo).  
El README del front está orientado a producto / venta; este documento es la referencia técnica de despliegue e integración.
