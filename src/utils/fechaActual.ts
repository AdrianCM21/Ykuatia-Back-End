
const fechaYMDHMS = (segundos:number=0) => {
    
    const now = new Date();
    now.setMinutes(now.getMinutes() + segundos);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const tiempo:string =`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    return tiempo
  };
const fechaYMD = (diasAdelante:number=0)=>{
    const now = new Date();
    const newDate = new Date(now);
    newDate.setDate(newDate.getDate() + diasAdelante);

    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const day = String(newDate.getDate()).padStart(2, '0');
    const tiempo:string =`${year}-${month}-${day}`
    return tiempo
}

  export {fechaYMDHMS,fechaYMD}