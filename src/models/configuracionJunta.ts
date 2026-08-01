import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

@Entity('configuracion_junta')
export class ConfiguracionJunta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120, default: 'Ykuatia ñangareko' })
  nombre: string;

  @Column({ length: 180, default: 'Cuidamos el agua de la comunidad' })
  slogan: string;

  @Column({ length: 180, default: '' })
  direccion: string;

  @Column({ length: 40, default: '' })
  telefono: string;

  @Column({ length: 80, default: '' })
  email: string;

  @Column({ type: 'text' })
  pie_boleta: string;

  @Column({ type: 'text' })
  pie_recibo: string;

  @Column({ length: 20, default: '#0B6E6E' })
  color_primario: string;

  @Column({ length: 20, default: '#1F4E79' })
  color_secundario: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_principal: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_secundario: string | null;

  @Column({ type: 'int', default: 40 })
  margen_mm: number;

  @Column({ type: 'boolean', default: false })
  mostrar_timbrado: boolean;

  @Column({ length: 80, default: '' })
  timbrado: string;

  @Column({ length: 40, default: '' })
  ruc: string;

  @Column({ type: 'int', default: 1 })
  nro_boleta_actual: number;

  @Column({ type: 'text', nullable: true })
  tpl_boleta: string | null;

  @Column({ type: 'text', nullable: true })
  tpl_deuda: string | null;

  @Column({ type: 'int', default: 14 })
  dias_gracia: number;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  mora_pct: number;

  @Column({ length: 20, default: 'clasica' })
  plantilla_boleta: string;

  /** a4 | oficio — usado sobre todo con plantilla básica (varias por hoja). */
  @Column({ length: 20, default: 'a4' })
  papel_boleta: string;

  /** 2 o 4 boletas por página (plantilla básica). */
  @Column({ type: 'int', default: 2 })
  boletas_por_pagina: number;

  @Column({ type: 'int', default: 1 })
  id_junta: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
