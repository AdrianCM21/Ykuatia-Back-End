import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn , OneToMany, ManyToOne, JoinColumn} from "typeorm"
import { Cliente } from "./clientes";


@Entity('facturas')
export class Factura {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    Fecha_emicion: Date

    @Column("decimal", { precision: 20, scale: 2 })
    monto: number

    @Column("decimal", { precision: 20, scale: 2, default: 0 })
    consumo: number

    @Column({default:false})
    delete:boolean

    @Column()
    estado:string

    @ManyToOne(() => Cliente, cliente => cliente.factura)
    @JoinColumn({ name: 'id_cliente' }) 
    cliente: Cliente;


}

