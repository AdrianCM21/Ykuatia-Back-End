import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Usuario } from './usuarios';

@Entity('eventos_auditoria')
export class EventoAuditoria {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario | null;

  @Index()
  @Column({ length: 60 })
  accion: string;

  @Index()
  @Column({ length: 40 })
  entidad: string;

  @Column({ type: 'int', nullable: true })
  entidad_id: number | null;

  @Column({ type: 'text', nullable: true })
  detalle: string | null;

  @Column({ type: 'int', default: 1 })
  id_junta: number;
}
