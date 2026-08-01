import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Datos mínimos para arrancar en cero.
 * Admin por defecto: admin@ykuatia.local / admin123
 */
export class SeedBaselineData1740000001000 implements MigrationInterface {
  name = 'SeedBaselineData1740000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`roles_usuarios\` (\`id_rol\`, \`descripcion\`) VALUES
        (1, 'admin'),
        (2, 'agente de campo')
    `);

    await queryRunner.query(`
      INSERT INTO \`tipos_clientes\` (\`id_tipo\`, \`descripcion\`, \`tarifa\`) VALUES
        (1, 'Tarifa fija', 25000),
        (2, 'Tarifa variable', 150)
    `);

    await queryRunner.query(`
      INSERT INTO \`tipos_ingresos\` (\`id\`, \`descripcion\`) VALUES
        (1, 'Egreso'),
        (2, 'Ingreso')
    `);

    // bcrypt hash de "admin123"
    await queryRunner.query(`
      INSERT INTO \`usuarios\` (\`email\`, \`password\`, \`Nombre\`, \`id_rol\`) VALUES
        (
          'admin@gmail.com',
          '$2b$10$AGBitscwzqp29mZ0Ozwa1e2b1Bhm4EcjHUbZ/lg8.dyeGYXqKNFay',
          'Administrador',
          1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM \`usuarios\` WHERE \`email\` = 'admin@ykuatia.local'`);
    await queryRunner.query(`DELETE FROM \`tipos_ingresos\` WHERE \`id\` IN (1, 2)`);
    await queryRunner.query(`DELETE FROM \`tipos_clientes\` WHERE \`id_tipo\` IN (1, 2)`);
    await queryRunner.query(`DELETE FROM \`roles_usuarios\` WHERE \`id_rol\` IN (1, 2)`);
  }
}
