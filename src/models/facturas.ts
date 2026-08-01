import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Cliente } from './clientes';

@Entity('facturas')
@Unique('UQ_factura_cliente_mes', ['cliente', 'anio_mes'])
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  Fecha_emicion: Date;

  @Column({ length: 7 })
  @Index()
  anio_mes: string;

  @Column('decimal', { precision: 20, scale: 2 })
  monto: number;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  monto_pagado: number;

  @Column('decimal', { precision: 20, scale: 2, default: 0 })
  consumo: number;

  @Column({ default: false })
  delete: boolean;

  @Column()
  estado: string;

  @Column({ type: 'datetime' })
  fecha_vencimiento: Date;

  @Column({ type: 'varchar', length: 40, nullable: true })
  nro_boleta: string | null;

  @Column({ type: 'int', default: 1 })
  id_junta: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.factura)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;
}
