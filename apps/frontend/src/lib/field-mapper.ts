/**
 * Utilitário para mapear campos entre camelCase (frontend) e snake_case (backend)
 */

/**
 * Converte string de camelCase para snake_case
 */
export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converte string de snake_case para camelCase
 */
export function snakeToCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Mapeia objeto de camelCase para snake_case recursivamente
 */
export function mapObjectToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => mapObjectToSnakeCase(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = camelToSnakeCase(key);
        result[snakeKey] = mapObjectToSnakeCase(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

/**
 * Mapeia objeto de snake_case para camelCase recursivamente
 */
export function mapObjectToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => mapObjectToCamelCase(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const camelKey = snakeToCamelCase(key);
        result[camelKey] = mapObjectToCamelCase(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}