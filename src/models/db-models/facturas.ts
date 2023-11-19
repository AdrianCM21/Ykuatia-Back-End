import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn ,Index, BeforeInsert, OneToMany, ManyToOne, JoinColumn} from "typeorm"

@Entity('estados')
export class Estado {
    @PrimaryGeneratedColumn()
    id_estado: number

    @Column({length:45})
    descripcion: string

    @OneToMany(() => Factura, factura => factura.estado)
    factura: Factura[];
}

@Entity('facturas')
export class Factura {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:15})
    Fecha_emicion: string

    @Column("decimal", { precision: 20, scale: 2 })
    monto: number

    @Column({default:false})
    delete:boolean

    @ManyToOne(() => Estado, estado => estado.factura)
    @JoinColumn({ name: 'id_estado' })  // Esta es la columna de la clave foránea
    estado: Estado;


}

