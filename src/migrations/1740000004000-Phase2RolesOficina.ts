import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2RolesOficina1740000004000 implements MigrationInterface {
  name = 'Phase2RolesOficina1740000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`roles_usuarios\` (\`descripcion\`)
      SELECT 'presidente' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles_usuarios\` WHERE \`descripcion\` = 'presidente')
    `);
    await queryRunner.query(`
      INSERT INTO \`roles_usuarios\` (\`descripcion\`)
      SELECT 'tesorero' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles_usuarios\` WHERE \`descripcion\` = 'tesorero')
    `);
    await queryRunner.query(`
      INSERT INTO \`roles_usuarios\` (\`descripcion\`)
      SELECT 'cajero' FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM \`roles_usuarios\` WHERE \`descripcion\` = 'cajero')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`roles_usuarios\`
      WHERE \`descripcion\` IN ('presidente', 'tesorero', 'cajero')
    `);
  }
}
