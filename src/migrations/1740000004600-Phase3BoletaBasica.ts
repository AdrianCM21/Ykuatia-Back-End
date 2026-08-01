import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3BoletaBasica1740000004600 implements MigrationInterface {
  name = 'Phase3BoletaBasica1740000004600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      ADD COLUMN \`papel_boleta\` varchar(20) NOT NULL DEFAULT 'a4',
      ADD COLUMN \`boletas_por_pagina\` int NOT NULL DEFAULT 2
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`configuracion_junta\`
      DROP COLUMN \`boletas_por_pagina\`,
      DROP COLUMN \`papel_boleta\`
    `);
  }
}
