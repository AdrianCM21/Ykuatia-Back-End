export const generarNumeroAleatorio=(digito:number)=> {
    const numeroConDiezDigitos = Math.floor(Math.random() * Math.pow(10, digito));
    const numeroFormateado = String(numeroConDiezDigitos).padStart(digito, '0');
    return numeroFormateado;
}
