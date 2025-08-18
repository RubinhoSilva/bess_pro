export interface GetInvertersQuery {
  userId?: string;
  page?: number;
  pageSize?: number;
  search?: string; // Busca por fabricante, modelo ou tipoRede
  fabricante?: string;
  tipoRede?: string;
  potenciaMin?: number;
  potenciaMax?: number;
  moduleReferencePower?: number; // Para cálculo de módulos suportados
}