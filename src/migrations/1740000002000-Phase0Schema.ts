import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase0Schema1740000002000 implements MigrationInterface {
  name = 'Phase0Schema1740000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      ADD COLUMN \`anio_mes\` varchar(7) NULL
    `);

    await queryRunner.query(`
      UPDATE \`facturas\`
      SET \`anio_mes\` = DATE_FORMAT(\`Fecha_emicion\`, '%Y-%m')
      WHERE \`anio_mes\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      MODIFY \`anio_mes\` varchar(7) NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_facturas_anio_mes\` ON \`facturas\` (\`anio_mes\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      ADD CONSTRAINT \`UQ_factura_cliente_mes\` UNIQUE (\`id_cliente\`, \`anio_mes\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`transacciones\`
      ADD COLUMN \`id_factura\` int NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`transacciones\`
      MODIFY \`motivo\` varchar(80) NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`transacciones\`
      ADD CONSTRAINT \`FK_transacciones_factura\`
      FOREIGN KEY (\`id_factura\`) REFERENCES \`facturas\`(\`id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_transacciones_id_factura\`
      ON \`transacciones\` (\`id_factura\`)
    `);

    await queryRunner.query(`
      CREATE TABLE \`configuracion_junta\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(120) NOT NULL DEFAULT 'Ykuatia ñangareko',
        \`slogan\` varchar(180) NOT NULL DEFAULT 'Cuidamos el agua de la comunidad',
        \`direccion\` varchar(180) NOT NULL DEFAULT '',
        \`telefono\` varchar(40) NOT NULL DEFAULT '',
        \`email\` varchar(80) NOT NULL DEFAULT '',
        \`pie_boleta\` text NOT NULL,
        \`pie_recibo\` text NOT NULL,
        \`color_primario\` varchar(20) NOT NULL DEFAULT '#0B6E6E',
        \`color_secundario\` varchar(20) NOT NULL DEFAULT '#1F4E79',
        \`logo_principal\` varchar(255) NULL,
        \`logo_secundario\` varchar(255) NULL,
        \`version\` int NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`configuracion_junta\`
        (\`nombre\`, \`slogan\`, \`direccion\`, \`telefono\`, \`email\`, \`pie_boleta\`, \`pie_recibo\`, \`color_primario\`, \`color_secundario\`, \`version\`)
      VALUES
        (
          'Ykuatia ñangareko',
          'Cuidamos el agua de la comunidad',
          '',
          '',
          '',
          'El agua es un tesoro. Usala con responsabilidad. Pagá tu boleta a tiempo.',
          'Gracias por tu pago. Conservá este recibo como comprobante.',
          '#0B6E6E',
          '#1F4E79',
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `configuracion_junta`');
    await queryRunner.query('DROP INDEX `IDX_transacciones_id_factura` ON `transacciones`');
    await queryRunner.query('ALTER TABLE `transacciones` DROP FOREIGN KEY `FK_transacciones_factura`');
    await queryRunner.query('ALTER TABLE `transacciones` DROP COLUMN `id_factura`');
    await queryRunner.query('ALTER TABLE `transacciones` MODIFY `motivo` varchar(40) NOT NULL');
    await queryRunner.query('ALTER TABLE `facturas` DROP INDEX `UQ_factura_cliente_mes`');
    await queryRunner.query('DROP INDEX `IDX_facturas_anio_mes` ON `facturas`');
    await queryRunner.query('ALTER TABLE `facturas` DROP COLUMN `anio_mes`');
  }
}
