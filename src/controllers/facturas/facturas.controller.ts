import { controlClienteTarifaFija } from "../../services/facturas/facturaJob.service"

const controlFacturas = async () => {
    try {
        // await controlClienteTarifaFija();
        console.log('se genero una factura')
    } catch (error) {
        throw error
    }
}

export { controlFacturas }
