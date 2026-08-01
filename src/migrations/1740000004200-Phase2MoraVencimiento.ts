import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2MoraVencimiento1740000004200 implements MigrationInterface {
  name = 'Phase2MoraVencimiento1740000004200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      ADD COLUMN \`fecha_vencimiento\` datetime NULL
    `);

    await queryRunner.query(`
      UPDATE \`facturas\`
      SET \`fecha_vencimiento\` = DATE_ADD(\`Fecha_emicion\`, INTERVAL 14 DAY)
      WHERE \`fecha_vencimiento\` IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`facturas\`
      MODIFY \`fecha_vencimiento\` datetime NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      ADD COLUMN \`dias_gracia\` int NOT NULL DEFAULT 14,
      ADD COLUMN \`mora_pct\` decimal(8,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      DROP COLUMN \`dias_gracia\`,
      DROP COLUMN \`mora_pct\`
    `);
    await queryRunner.query('ALTER TABLE `facturas` DROP COLUMN `fecha_vencimiento`');
  }
}
