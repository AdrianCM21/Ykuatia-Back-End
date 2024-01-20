import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn ,Index, BeforeInsert, OneToMany, ManyToOne, JoinColumn} from "typeorm"

@Entity('tipos_ingresos')
export class TipoIngreso {
    @PrimaryGeneratedColumn()
    id_tipo_ingreso: number

    @Column({length:45})
    descripcion: string

    @OneToMany(() => Transaccion, transaccion => transaccion.tipo_ingreso)
    factura: Transaccion[];
}

@Entity('transacciones')
export class Transaccion {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    mitivo: string

    @Column({length:40})
    fecha: string

    @Column("decimal", { precision: 20, scale: 2 })
    monto: number;

    @Column()
    ingreso: boolean

    @Column({default:false})
    delete:boolean

    @ManyToOne(() => TipoIngreso, tipoIngreso => tipoIngreso.factura)
    @JoinColumn({ name: 'id_tipo_ingreso' })  // Esta es la columna de la clave foránea
    tipo_ingreso: TipoIngreso;


}

