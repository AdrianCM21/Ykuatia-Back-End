import { schedule } from "node-cron";
import { controlFacturas } from "../controllers/facturas/facturas.controller";

export const facturasCron = schedule("*/30 * * * * *", controlFacturas);
