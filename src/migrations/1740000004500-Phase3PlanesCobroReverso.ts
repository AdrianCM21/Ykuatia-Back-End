import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3PlanesCobroReverso1740000004500 implements MigrationInterface {
  name = 'Phase3PlanesCobroReverso1740000004500';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`transacciones\`
      ADD COLUMN \`id_plan\` int NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`transacciones\`
      ADD CONSTRAINT \`FK_transacciones_plan\`
      FOREIGN KEY (\`id_plan\`) REFERENCES \`planes_pago\`(\`id\`)
    `);
    await queryRunner.query(`
      CREATE INDEX \`IDX_transacciones_plan\` ON \`transacciones\` (\`id_plan\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`transacciones\` DROP FOREIGN KEY \`FK_transacciones_plan\`
    `);
    await queryRunner.query(`DROP INDEX \`IDX_transacciones_plan\` ON \`transacciones\``);
    await queryRunner.query(`ALTER TABLE \`transacciones\` DROP COLUMN \`id_plan\``);
  }
}
