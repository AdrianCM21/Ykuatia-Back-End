import { Entity, Column, PrimaryGeneratedColumn} from "typeorm"

@Entity('auditorias')
export class Auditoria {
    @PrimaryGeneratedColumn()
    id: number

    @Column("text")
    historial_cambios: string


}