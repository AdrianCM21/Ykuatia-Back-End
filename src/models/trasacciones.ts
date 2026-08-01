import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Factura } from './facturas';
import { PlanPago } from './planPago';

@Entity('tipos_ingresos')
export class TipoIngreso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45 })
  descripcion: string;

  @OneToMany(() => Transaccion, (transaccion) => transaccion.tipo_ingreso)
  transaciones: Transaccion[];
}

@Entity('transacciones')
export class Transaccion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  motivo: string;

  @CreateDateColumn()
  fecha: Date;

  @Column('decimal', { precision: 20, scale: 2 })
  monto: number;

  @Column({ default: false })
  delete: boolean;

  @ManyToOne(() => TipoIngreso, (tipoIngreso) => tipoIngreso.transaciones)
  @JoinColumn({ name: 'id_tipo_ingreso' })
  tipo_ingreso: TipoIngreso;

  @ManyToOne(() => Factura, { nullable: true })
  @JoinColumn({ name: 'id_factura' })
  @Index()
  factura: Factura | null;

  @ManyToOne(() => PlanPago, { nullable: true })
  @JoinColumn({ name: 'id_plan' })
  @Index()
  plan: PlanPago | null;

  @Column({ type: 'int', default: 1 })
  id_junta: number;
}
