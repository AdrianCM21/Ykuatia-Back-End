import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn ,Index, BeforeInsert, OneToMany, ManyToOne, JoinColumn} from "typeorm"

@Entity('tipos_clientes')
export class TipoCliente {
    @PrimaryGeneratedColumn()
    id_tipo: number

    @Column({length:45})
    descripcion: string

    @Column()
    tarifa: number

    @OneToMany(() => Cliente, cliente => cliente.tipoCliente)
    clientes: Cliente[];
}

@Entity('clientes')
@Index(['cedula'], { unique: true }) 
export class Cliente {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:45})
    nombre: string

    @Column({length:10})
    cedula: string

    @Column({length:45})
    direccion: string

    @Column({default:0})
    meses_deuda: number

    @Column("decimal", { precision: 20, scale: 2 , default:0})
    total_deuda: number


    @Column({length:12})
    telefono: string

    @CreateDateColumn({ type: 'timestamp' })
    fecha_creacion: Date;

    @Column({default:false})
    delete:boolean

    @ManyToOne(() => TipoCliente, tipoCliente => tipoCliente.clientes)
    @JoinColumn({ name: 'id_tipo' })  // Esta es la columna de la clave foránea
    tipoCliente: TipoCliente;


    @BeforeInsert()
    setFechaCreacion() {
        this.fecha_creacion = new Date();
    }

}

