import express from "express";
import helmet from "helmet";
import dotenv from "dotenv"
import cors from "cors"
import expressJwt from 'express-jwt';
import guard from 'express-jwt-permissions';
dotenv.config();
import routes from "./routes"


const app = express();


app.use(express.json());
app.use(helmet())
app.use(cors())

routes(app)

// @ts-ignore
global.__basedir = __dirname;

export default app