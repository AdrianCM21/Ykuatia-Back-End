import app from "./app"
import { AppDataSource } from "./config/db.config";

const PORT = 3000
const main =async ()=>{
    await AppDataSource.initialize()
    app.listen(PORT,()=>{
        console.log(`Server on port ${PORT}`)
    });
}
main()