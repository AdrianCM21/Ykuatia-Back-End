export const getAnioMesActual = (fecha: Date = new Date()): string => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getAnioMesFromDate = (fecha: Date): string => getAnioMesActual(fecha);
