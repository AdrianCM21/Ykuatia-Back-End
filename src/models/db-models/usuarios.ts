import { Entity, Column, PrimaryGeneratedColumn ,Index} from "typeorm"

@Entity()
export class usuarios {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({length:10})
    cedula!: string

    @Column({length:45})
    Nombre!: string

    @Column({length:45})
    email!: string

    @Column({length:45})
    rol!: string

    @Column({length:12})
    telefono!: string

}