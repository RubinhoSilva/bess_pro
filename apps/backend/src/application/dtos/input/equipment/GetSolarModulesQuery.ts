export interface GetSolarModulesQuery {
  userId?: string;
  page?: number;
  pageSize?: number;
  search?: string; // Busca por fabricante, modelo ou tipoCelula
  fabricante?: string;
  tipoCelula?: string;
  potenciaMin?: number;
  potenciaMax?: number;
}