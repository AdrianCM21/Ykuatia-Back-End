import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Usuario } from './usuarios';

@Entity('cierres_caja')
@Unique('UQ_cierre_junta_periodo', ['id_junta', 'periodo_tipo', 'periodo'])
export class CierreCaja {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 10 })
  periodo_tipo: 'dia' | 'mes';

  @Column({ length: 10 })
  periodo: string;

  @Column({ type: 'int', default: 1 })
  id_junta: number;

  @Column('decimal', { precision: 20, scale: 2 })
  ingresos: number;

  @Column('decimal', { precision: 20, scale: 2 })
  egresos: number;

  @Column('decimal', { precision: 20, scale: 2 })
  saldo: number;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario | null;

  @CreateDateColumn()
  cerrado_en: Date;

  @Column({ type: 'datetime', nullable: true })
  reabierto_en: Date | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ default: true })
  activo: boolean;
}
