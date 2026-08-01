import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1740000000000 implements MigrationInterface {
  name = 'InitSchema1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`roles_usuarios\` (
        \`id_rol\` int NOT NULL AUTO_INCREMENT,
        \`descripcion\` varchar(40) NOT NULL,
        PRIMARY KEY (\`id_rol\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`usuarios\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(40) NOT NULL,
        \`password\` varchar(100) NOT NULL,
        \`Nombre\` varchar(40) NOT NULL,
        \`id_rol\` int NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_usuarios_roles\` FOREIGN KEY (\`id_rol\`) REFERENCES \`roles_usuarios\`(\`id_rol\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`tipos_clientes\` (
        \`id_tipo\` int NOT NULL AUTO_INCREMENT,
        \`descripcion\` varchar(45) NOT NULL,
        \`tarifa\` int NOT NULL,
        PRIMARY KEY (\`id_tipo\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`auditorias\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`historial_cambios\` text NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`clientes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(45) NOT NULL,
        \`cedula\` varchar(10) NOT NULL,
        \`direccion\` varchar(45) NOT NULL,
        \`telefono\` varchar(12) NOT NULL,
        \`locacion\` varchar(255) NOT NULL,
        \`fecha_creacion\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`delete\` tinyint NOT NULL DEFAULT 0,
        \`id_auditoria\` int NULL,
        \`id_tipo\` int NULL,
        UNIQUE INDEX \`IDX_clientes_cedula\` (\`cedula\`),
        UNIQUE INDEX \`REL_clientes_auditoria\` (\`id_auditoria\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_clientes_auditoria\` FOREIGN KEY (\`id_auditoria\`) REFERENCES \`auditorias\`(\`id\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT \`FK_clientes_tipo\` FOREIGN KEY (\`id_tipo\`) REFERENCES \`tipos_clientes\`(\`id_tipo\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`facturas\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`Fecha_emicion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`monto\` decimal(20,2) NOT NULL,
        \`consumo\` decimal(20,2) NOT NULL DEFAULT 0,
        \`delete\` tinyint NOT NULL DEFAULT 0,
        \`estado\` varchar(255) NOT NULL,
        \`id_cliente\` int NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_facturas_cliente\` FOREIGN KEY (\`id_cliente\`) REFERENCES \`clientes\`(\`id\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`tipos_ingresos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`descripcion\` varchar(45) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`transacciones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`motivo\` varchar(40) NOT NULL,
        \`fecha\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`monto\` decimal(20,2) NOT NULL,
        \`delete\` tinyint NOT NULL DEFAULT 0,
        \`id_tipo_ingreso\` int NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_transacciones_tipo\` FOREIGN KEY (\`id_tipo_ingreso\`) REFERENCES \`tipos_ingresos\`(\`id\`)
          ON DELETE NO ACTION ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `transacciones`');
    await queryRunner.query('DROP TABLE `tipos_ingresos`');
    await queryRunner.query('DROP TABLE `facturas`');
    await queryRunner.query('DROP TABLE `clientes`');
    await queryRunner.query('DROP TABLE `auditorias`');
    await queryRunner.query('DROP TABLE `tipos_clientes`');
    await queryRunner.query('DROP TABLE `usuarios`');
    await queryRunner.query('DROP TABLE `roles_usuarios`');
  }
}
