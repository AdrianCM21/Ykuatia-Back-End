import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cliente } from './clientes';
import { Factura } from './facturas';
import { Usuario } from './usuarios';

@Entity('lecturas')
export class Lectura {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, { nullable: false })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Cliente;

  @ManyToOne(() => Factura, { nullable: true })
  @JoinColumn({ name: 'id_factura' })
  factura: Factura | null;

  @Column('decimal', { precision: 20, scale: 2 })
  consumo: number;

  @CreateDateColumn()
  fecha: Date;

  @Column({ length: 20, default: 'oficina' })
  origen: string;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario | null;

  @Column({ type: 'int', default: 1 })
  id_junta: number;
}
