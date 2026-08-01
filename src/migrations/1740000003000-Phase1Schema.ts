import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase1Schema1740000003000 implements MigrationInterface {
  name = 'Phase1Schema1740000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`clientes\`
      ADD COLUMN \`nro_medidor\` varchar(40) NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_clientes_nro_medidor\`
      ON \`clientes\` (\`nro_medidor\`)
    `);

    await queryRunner.query(`
      CREATE TABLE \`lecturas\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`consumo\` decimal(20,2) NOT NULL,
        \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`origen\` varchar(20) NOT NULL DEFAULT 'oficina',
        \`id_cliente\` int NOT NULL,
        \`id_factura\` int NULL,
        \`id_usuario\` int NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_lecturas_cliente\` FOREIGN KEY (\`id_cliente\`) REFERENCES \`clientes\`(\`id\`),
        CONSTRAINT \`FK_lecturas_factura\` FOREIGN KEY (\`id_factura\`) REFERENCES \`facturas\`(\`id\`),
        CONSTRAINT \`FK_lecturas_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuarios\`(\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`eventos_auditoria\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`accion\` varchar(60) NOT NULL,
        \`entidad\` varchar(40) NOT NULL,
        \`entidad_id\` int NULL,
        \`detalle\` text NULL,
        \`id_usuario\` int NULL,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_eventos_accion\` (\`accion\`),
        INDEX \`IDX_eventos_entidad\` (\`entidad\`),
        CONSTRAINT \`FK_eventos_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuarios\`(\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`cierres_caja\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`periodo_tipo\` varchar(10) NOT NULL,
        \`periodo\` varchar(10) NOT NULL,
        \`ingresos\` decimal(20,2) NOT NULL,
        \`egresos\` decimal(20,2) NOT NULL,
        \`saldo\` decimal(20,2) NOT NULL,
        \`cerrado_en\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`reabierto_en\` datetime NULL,
        \`notas\` text NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        \`id_usuario\` int NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_cierre_periodo\` (\`periodo_tipo\`, \`periodo\`),
        CONSTRAINT \`FK_cierres_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuarios\`(\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      ADD COLUMN \`nro_boleta\` varchar(40) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      ADD COLUMN \`margen_mm\` int NOT NULL DEFAULT 40,
      ADD COLUMN \`mostrar_timbrado\` tinyint NOT NULL DEFAULT 0,
      ADD COLUMN \`timbrado\` varchar(80) NOT NULL DEFAULT '',
      ADD COLUMN \`ruc\` varchar(40) NOT NULL DEFAULT '',
      ADD COLUMN \`nro_boleta_actual\` int NOT NULL DEFAULT 1,
      ADD COLUMN \`tpl_boleta\` text NULL,
      ADD COLUMN \`tpl_deuda\` text NULL
    `);

    await queryRunner.query(`
      UPDATE \`configuracion_junta\`
      SET
        \`tpl_boleta\` = 'Hola {nombre}, te enviamos el aviso de boleta de {junta} por el período {periodo}. Monto: {monto} Gs. ¡Gracias!',
        \`tpl_deuda\` = 'Hola {nombre}, desde {junta} te recordamos que tenés una deuda de {monto} Gs (período {periodo}). Por favor acercate a cancelar. ¡Gracias!'
      WHERE \`tpl_boleta\` IS NULL OR \`tpl_deuda\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      DROP COLUMN \`margen_mm\`,
      DROP COLUMN \`mostrar_timbrado\`,
      DROP COLUMN \`timbrado\`,
      DROP COLUMN \`ruc\`,
      DROP COLUMN \`nro_boleta_actual\`,
      DROP COLUMN \`tpl_boleta\`,
      DROP COLUMN \`tpl_deuda\`
    `);
    await queryRunner.query('ALTER TABLE `facturas` DROP COLUMN `nro_boleta`');
    await queryRunner.query('DROP TABLE `cierres_caja`');
    await queryRunner.query('DROP TABLE `eventos_auditoria`');
    await queryRunner.query('DROP TABLE `lecturas`');
    await queryRunner.query('DROP INDEX `IDX_clientes_nro_medidor` ON `clientes`');
    await queryRunner.query('ALTER TABLE `clientes` DROP COLUMN `nro_medidor`');
  }
}
