import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn ,Index} from "typeorm"

@Entity()
@Index(['cedula'], { unique: true }) 
export class clientes {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({length:45})
    nombre!: string

    @Column({length:10})
    cedula!: string

    @Column({length:45})
    direccion!: string

    @Column({length:45})
    longitud!: string

    @Column({length:45})
    latitud!: string

    @Column({length:12})
    telefono!: string

    @CreateDateColumn({ type: 'timestamp' })
    fecha_creacion!: Date;

    @Column({default:false})
    delete!:boolean

}