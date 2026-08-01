export interface JwtPayload {
  id: number;
  nombre: string;
  rol: string;
  juntaId: number;
  iat?: number;
  exp?: number;
}
