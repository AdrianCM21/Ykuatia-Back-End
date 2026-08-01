import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './clientes';
import { Factura } from './facturas';

@Entity('planes_pago')
export class PlanPago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Factura, { nullable: true })
  @JoinColumn({ name: 'id_factura' })
  factura: Factura | null;

  @Column('decimal', { precision: 20, scale: 2 })
  monto_total: number;

  @Column({ type: 'int' })
  cuotas: number;

  @Column('decimal', { precision: 20, scale: 2 })
  monto_cuota: number;

  @Column({ type: 'int', default: 0 })
  cuotas_pagadas: number;

  @Column({ length: 40, default: 'activo' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ type: 'int', default: 1 })
  id_junta: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
