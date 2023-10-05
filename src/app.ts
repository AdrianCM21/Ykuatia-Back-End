import express from "express";
import helmet from "helmet";
import cors from "cors"
import routes from "./routes"
require('dotenv').config({ path: '.env' }); 

const app = express();


app.use(express.json());
app.use(helmet())
app.use(cors())

routes(app)

export default app