import { Entity, Column, PrimaryGeneratedColumn ,Index, OneToMany, ManyToOne, JoinColumn} from "typeorm"

@Entity('roles_usuarios')
export class RolUsuario {
    @PrimaryGeneratedColumn()
    id_rol: number

    @Column({length:40})
    descripcion: string

    @OneToMany(()=>Usuario,usuario=>usuario.rol)
    usuarios:Usuario[]


}

@Entity('usuarios')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number

    @Column({length:40})
    email: string

    @Column({length:10})
    password: string

    @Column({length:40})
    Nombre: string

    @ManyToOne(()=>RolUsuario,rol=>rol.usuarios)
    @JoinColumn({name:'id_rol'})
    rol:RolUsuario


}