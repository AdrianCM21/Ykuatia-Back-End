import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2MultiJunta1740000004400 implements MigrationInterface {
  name = 'Phase2MultiJunta1740000004400';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`juntas\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(120) NOT NULL,
        \`slug\` varchar(80) NOT NULL,
        \`activa\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_juntas_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`juntas\` (\`nombre\`, \`slug\`, \`activa\`)
      SELECT COALESCE(MAX(\`nombre\`), 'Ykuatia'), 'ykuatia', 1
      FROM \`configuracion_junta\`
    `);

    const tables = [
      'clientes',
      'facturas',
      'transacciones',
      'cierres_caja',
      'lecturas',
      'eventos_auditoria',
      'usuarios',
      'tipos_clientes',
      'configuracion_junta',
      'planes_pago',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        ALTER TABLE \`${table}\`
        ADD COLUMN \`id_junta\` int NOT NULL DEFAULT 1
      `);
      await queryRunner.query(`
        UPDATE \`${table}\` SET \`id_junta\` = 1
      `);
      await queryRunner.query(`
        ALTER TABLE \`${table}\`
        ADD CONSTRAINT \`FK_${table}_junta\`
        FOREIGN KEY (\`id_junta\`) REFERENCES \`juntas\`(\`id\`)
      `);
      await queryRunner.query(`
        CREATE INDEX \`IDX_${table}_junta\` ON \`${table}\` (\`id_junta\`)
      `);
    }

    await queryRunner.query('DROP INDEX `IDX_clientes_cedula` ON `clientes`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_clientes_junta_cedula\`
      ON \`clientes\` (\`id_junta\`, \`cedula\`)
    `);

    await queryRunner.query('DROP INDEX `IDX_clientes_nro_medidor` ON `clientes`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_clientes_junta_medidor\`
      ON \`clientes\` (\`id_junta\`, \`nro_medidor\`)
    `);

    await queryRunner.query('ALTER TABLE `cierres_caja` DROP INDEX `UQ_cierre_periodo`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_cierre_junta_periodo\`
      ON \`cierres_caja\` (\`id_junta\`, \`periodo_tipo\`, \`periodo\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `cierres_caja` DROP INDEX `UQ_cierre_junta_periodo`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_cierre_periodo\`
      ON \`cierres_caja\` (\`periodo_tipo\`, \`periodo\`)
    `);

    await queryRunner.query('DROP INDEX `UQ_clientes_junta_medidor` ON `clientes`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_clientes_nro_medidor\` ON \`clientes\` (\`nro_medidor\`)
    `);
    await queryRunner.query('DROP INDEX `UQ_clientes_junta_cedula` ON `clientes`');
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_clientes_cedula\` ON \`clientes\` (\`cedula\`)
    `);

    const tables = [
      'planes_pago',
      'configuracion_junta',
      'tipos_clientes',
      'usuarios',
      'eventos_auditoria',
      'lecturas',
      'cierres_caja',
      'transacciones',
      'facturas',
      'clientes',
    ];

    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`FK_${table}_junta\``);
      await queryRunner.query(`DROP INDEX \`IDX_${table}_junta\` ON \`${table}\``);
      await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`id_junta\``);
    }

    await queryRunner.query('DROP TABLE `juntas`');
  }
}
