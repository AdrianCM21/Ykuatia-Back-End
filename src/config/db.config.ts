import { DataSource } from "typeorm"
import { usuarios } from "../models/db-models/usuarios"
require('dotenv').config({ path: '.env' });


export const AppDataSource = new DataSource({
    type: "mysql",
    host:process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true,
    logging: false,
    entities: [usuarios],
})