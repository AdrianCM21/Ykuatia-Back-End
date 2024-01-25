import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn ,Index, BeforeInsert, OneToMany, ManyToOne, JoinColumn} from "typeorm"

@Entity('tipos_ingresos')
export class TipoIngreso {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:45})
    descripcion: string

    @OneToMany(() => Transaccion, transaccion => transaccion.tipo_ingreso)
    transaciones: Transaccion[];
}

@Entity('transacciones')
export class Transaccion {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    motivo: string

    @CreateDateColumn()
    fecha: Date

    @Column("decimal", { precision: 20, scale: 2 })
    monto: number;

    @Column({default:false})
    delete:boolean

    @ManyToOne(() => TipoIngreso, tipoIngreso => tipoIngreso.transaciones)
    @JoinColumn({ name: 'id_tipo_ingreso' })  // Esta es la columna de la clave foránea
    tipo_ingreso: TipoIngreso;


}

