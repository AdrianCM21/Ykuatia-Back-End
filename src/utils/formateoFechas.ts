const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const formatDateDiaMesAño=(fechaEmicion: Date)=> {
    const fecha = new Date(fechaEmicion);
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; 
    const año = fecha.getFullYear(); 

  
    return `${dia}/${mes}/${año}`;

}

export const formateoDiaMesAñoHoraMinuto=(fechaEmicion: Date)=> {
    const fecha = new Date(fechaEmicion);
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; 
    const año = fecha.getFullYear(); 
    const hora = fecha.getHours();
    const minutos = fecha.getMinutes();
    return `${dia}/${mes}/${año}T${hora}:${minutos}`;
}

export const formateoMes=(fechaEmicion: Date)=> {
    const fecha = new Date(fechaEmicion);
    const mes = fecha.getMonth() 
    return nombresMeses[mes];
}