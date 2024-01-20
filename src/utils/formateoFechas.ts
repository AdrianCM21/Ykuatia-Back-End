const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const formatDateDiaMesAño=(fechaEmicion: Date)=> {
    const fecha = new Date(fechaEmicion);
    const dia = fecha.getDate(); // Obtiene el día del mes (1-31)
    const mes = fecha.getMonth() + 1; // Obtiene el mes (1-12)
    const año = fecha.getFullYear(); // Obtiene el año

  
    return `${dia}/${mes}/${año}`;

}

export const formateoMes=(fechaEmicion: Date)=> {
    const fecha = new Date(fechaEmicion);
    const mes = fecha.getMonth() + 1; // Obtiene el mes (1-12)
    return nombresMeses[mes];
}