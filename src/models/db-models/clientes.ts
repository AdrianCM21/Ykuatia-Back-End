import { Entity, Column, PrimaryGeneratedColumn ,Index} from "typeorm"

@Entity()
@Index(['ruc'], { unique: true }) 
export class clientes {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({length:10})
    ruc!: string

    @Column({length:45})
    razon_social!: string

    @Column({length:45})
    email!: string

    @Column({length:45})
    nombre_fantasia!: string

    @Column({length:12})
    telefono!: string

    @Column({length:12})
    celular!: string

    @Column({length:45})
    direccion!: string

    @Column({length:7})
    departamento!: string
    @Column({length:7})
    ciudad!: string
    @Column({length:7})
    distrito!: string
}