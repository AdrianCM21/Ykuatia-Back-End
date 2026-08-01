import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2PagosParcialesPlanes1740000004100 implements MigrationInterface {
  name = 'Phase2PagosParcialesPlanes1740000004100';

  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [table, column]
    );
    return Number(rows[0]?.c || 0) > 0;
  }

  private async indexExists(
    queryRunner: QueryRunner,
    table: string,
    index: string
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [table, index]
    );
    return Number(rows[0]?.c || 0) > 0;
  }

  private async tableExists(queryRunner: QueryRunner, table: string): Promise<boolean> {
    const rows = await queryRunner.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [table]
    );
    return Number(rows[0]?.c || 0) > 0;
  }

  private async fkExists(queryRunner: QueryRunner, table: string, fk: string): Promise<boolean> {
    const rows = await queryRunner.query(
      `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [table, fk]
    );
    return Number(rows[0]?.c || 0) > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.columnExists(queryRunner, 'facturas', 'monto_pagado'))) {
      await queryRunner.query(`
        ALTER TABLE \`facturas\`
        ADD COLUMN \`monto_pagado\` decimal(20,2) NOT NULL DEFAULT 0
      `);
    }

    await queryRunner.query(`
      UPDATE \`facturas\`
      SET \`monto_pagado\` = \`monto\`
      WHERE \`estado\` = 'pagado' AND \`monto_pagado\` = 0
    `);

    // MySQL no permite dropear el índice único si la FK lo usa
    if (await this.fkExists(queryRunner, 'transacciones', 'FK_transacciones_factura')) {
      await queryRunner.query(`
        ALTER TABLE \`transacciones\`
        DROP FOREIGN KEY \`FK_transacciones_factura\`
      `);
    }

    if (await this.indexExists(queryRunner, 'transacciones', 'IDX_transacciones_id_factura')) {
      await queryRunner.query(`
        DROP INDEX \`IDX_transacciones_id_factura\` ON \`transacciones\`
      `);
    }

    if (!(await this.indexExists(queryRunner, 'transacciones', 'IDX_transacciones_factura'))) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_transacciones_factura\`
        ON \`transacciones\` (\`id_factura\`)
      `);
    }

    if (!(await this.fkExists(queryRunner, 'transacciones', 'FK_transacciones_factura'))) {
      await queryRunner.query(`
        ALTER TABLE \`transacciones\`
        ADD CONSTRAINT \`FK_transacciones_factura\`
        FOREIGN KEY (\`id_factura\`) REFERENCES \`facturas\`(\`id\`)
      `);
    }

    if (!(await this.tableExists(queryRunner, 'planes_pago'))) {
      await queryRunner.query(`
        CREATE TABLE \`planes_pago\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`id_cliente\` int NOT NULL,
          \`id_factura\` int NULL,
          \`monto_total\` decimal(20,2) NOT NULL,
          \`cuotas\` int NOT NULL,
          \`monto_cuota\` decimal(20,2) NOT NULL,
          \`cuotas_pagadas\` int NOT NULL DEFAULT 0,
          \`estado\` varchar(40) NOT NULL DEFAULT 'activo',
          \`notas\` text NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`FK_planes_cliente\` FOREIGN KEY (\`id_cliente\`) REFERENCES \`clientes\`(\`id\`),
          CONSTRAINT \`FK_planes_factura\` FOREIGN KEY (\`id_factura\`) REFERENCES \`facturas\`(\`id\`)
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.tableExists(queryRunner, 'planes_pago')) {
      await queryRunner.query('DROP TABLE `planes_pago`');
    }
    if (await this.fkExists(queryRunner, 'transacciones', 'FK_transacciones_factura')) {
      await queryRunner.query(`
        ALTER TABLE \`transacciones\`
        DROP FOREIGN KEY \`FK_transacciones_factura\`
      `);
    }
    if (await this.indexExists(queryRunner, 'transacciones', 'IDX_transacciones_factura')) {
      await queryRunner.query('DROP INDEX `IDX_transacciones_factura` ON `transacciones`');
    }
    if (!(await this.indexExists(queryRunner, 'transacciones', 'IDX_transacciones_id_factura'))) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_transacciones_id_factura\`
        ON \`transacciones\` (\`id_factura\`)
      `);
    }
    if (!(await this.fkExists(queryRunner, 'transacciones', 'FK_transacciones_factura'))) {
      await queryRunner.query(`
        ALTER TABLE \`transacciones\`
        ADD CONSTRAINT \`FK_transacciones_factura\`
        FOREIGN KEY (\`id_factura\`) REFERENCES \`facturas\`(\`id\`)
      `);
    }
    if (await this.columnExists(queryRunner, 'facturas', 'monto_pagado')) {
      await queryRunner.query('ALTER TABLE `facturas` DROP COLUMN `monto_pagado`');
    }
  }
}
