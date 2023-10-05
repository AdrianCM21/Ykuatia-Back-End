const supertest =require("supertest")
import app from "../../app";
import { AppDataSource } from "../../config/db.config";
import { generarNumeroAleatorio } from "../../utils/numeroRamdom";
const request= supertest(app)

beforeAll(async () => {
  // Inicializa TypeORM con la configuración de pruebas
  await AppDataSource.initialize();
  // Crea la tabla dinámica antes de las pruebas
  await createDynamicTable();
});

afterAll(async () => {
  // Elimina la tabla dinámica después de todas las pruebas
  await dropDynamicTable();
  // Cierra la conexión de TypeORM después de todas las pruebas
  await AppDataSource.close();
});

// Función para crear la tabla dinámica
const createDynamicTable=async()=> {
  const query = `
    CREATE TABLE IF NOT EXISTS clientes(
      id INT AUTO_INCREMENT PRIMARY KEY,
      razon_social VARCHAR(255) NOT NULL,
      nombre_fantasia VARCHAR(255) NOT NULL,
      telefono VARCHAR(255) NOT NULL,
      celular VARCHAR(255) NOT NULL,
      razon_social VARCHAR(255) NOT NULL,
      direccion VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      departamento VARCHAR(255) NOT NULL,
      distrito VARCHAR(255) NOT NULL,
      ciudad VARCHAR(255) NOT NULL
    )
  `;
  await AppDataSource.query(query);
}

// Función para eliminar la tabla dinámica
const dropDynamicTable=async()=> {
  const query = `TRUNCATE TABLE clientes `;
  await AppDataSource.query(query);
}

describe("Endpoint test clientes", () => {
 const cliente = {
  "ruc":`${generarNumeroAleatorio(5)}-5`,
  "razon_social":"user1",
  "nombre_fantasia":"user1",
  "telefono":"0987651212",
  "celular":"0986511212",
  "direccion":"itapua",
  "email":"a@gmail.com",
  "distrito":"1",
  "departamento":"1",
  "ciudad":"1"
}
  it("Deveria poder agregarse Cliente", async () => {
   
    const response = await request.post("/api/customers").set('x-api-key','Yq3t6v9y').send(cliente)
    expect(response.status).toBe(200);
    console.log(response.body)

  });
  it("No deveria permitirme agregar cliente por numero de ruc duplicado",async ()=>{
    
    const responseDupicada = await request.post("/api/customers").set('x-api-key','Yq3t6v9y').send(cliente)
    expect(responseDupicada.body.code).toBe('ER_DUP_ENTRY');
  })
  it("Deveria poder Editar un cliente",async ()=>{
    
    const responseEdit = await request.put(`/api/customers/1`).set('x-api-key','Yq3t6v9y').send({...cliente,"razon_social":"user2"})
    expect(responseEdit.status).toBe(200);
    expect(responseEdit.body.razon_social).toBe('user2')

  })
});
