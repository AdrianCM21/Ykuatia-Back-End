import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2PlantillaBoleta1740000004300 implements MigrationInterface {
  name = 'Phase2PlantillaBoleta1740000004300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      ADD COLUMN \`plantilla_boleta\` varchar(20) NOT NULL DEFAULT 'clasica'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      DROP COLUMN \`plantilla_boleta\`
    `);
  }
}
