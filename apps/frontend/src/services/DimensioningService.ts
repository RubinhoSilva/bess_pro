import api from '../lib/api';
import { ErrorHandler } from '../errors/ErrorHandler';
import { 
  dimensioningToApiRequest, 
  validateDimensioningData, 
  apiResponseToDimensioning,
  LegacyDimensioningData
} from '../mappers/dimensioning-mapper';

/**
 * Service para gerenciamento de dimensionamentos
 * Responsável por API calls, validações e regras de negócio
 * Segue padrão singleton como outros services do projeto
 */
export class DimensioningService {
  private static instance: DimensioningService;

  private constructor() {}

  static getInstance(): DimensioningService {
    if (!DimensioningService.instance) {
      DimensioningService.instance = new DimensioningService();
    }
    return DimensioningService.instance;
  }

  /**
   * Tratamento centralizado de erros
   * Converte erros da API para erros tratados da aplicação
   */
  private handleError(error: unknown, operation: string): never {
    const appError = ErrorHandler.handle(error, `DimensioningService.${operation}`);
    throw appError;
  }

  /**
   * Salva ou atualiza um dimensionamento
   * Cria novo projeto se não tiver ID, atualiza se já existir
   */
  async saveDimensioning(dimensioning: LegacyDimensioningData, dimensioningId?: string): Promise<{
    id: string;
    createdAt: string;
    updatedAt: string;
  }> {
    try {
      // Validar dados obrigatórios antes de enviar
      const validationErrors = validateDimensioningData(dimensioning);
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join('; ')}`);
      }

      // Converter dados para formato da API
      const requestData = dimensioningToApiRequest(dimensioning);

      // Configurar headers com token de autenticação
      const token = this.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      let response: any;
      
      if (!dimensioningId) {
        // Criar novo dimensionamento (projeto)
        response = await api.post('/projects', requestData, config);
      } else {
        // Atualizar dimensionamento existente
        response = await api.put(`/projects/${dimensioningId}`, requestData, config);
      }

      return {
        id: response.data.data.id,
        createdAt: response.data.data.createdAt,
        updatedAt: response.data.data.updatedAt
      };

    } catch (error) {
      this.handleError(error, 'saveDimensioning');
    }
  }

  /**
   * Busca dimensionamento por ID
   * Retorna dados completos do projeto
   */
  async getDimensioningById(id: string): Promise<LegacyDimensioningData> {
    try {
      const token = this.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const response = await api.get(`/projects/${id}`, config);
      return apiResponseToDimensioning(response.data.data);

    } catch (error) {
      this.handleError(error, 'getDimensioningById');
    }
  }

  /**
   * Lista dimensionamentos do usuário
   * Retorna projetos paginados
   */
  async listDimensionings(filters?: {
    customerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    projects: LegacyDimensioningData[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const token = this.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: filters
      };

      const response = await api.get('/projects', config);
      
      return {
        projects: response.data.data.projects?.map(apiResponseToDimensioning) || [],
        total: response.data.data.total || 0,
        page: response.data.data.page || 1,
        totalPages: response.data.data.totalPages || 1
      };

    } catch (error) {
      this.handleError(error, 'listDimensionings');
    }
  }

  /**
   * Exclui um dimensionamento
   * Remove projeto permanentemente
   */
  async deleteDimensioning(id: string): Promise<void> {
    try {
      const token = this.getAuthToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await api.delete(`/projects/${id}`, config);

    } catch (error) {
      this.handleError(error, 'deleteDimensioning');
    }
  }

  /**
   * Duplica um dimensionamento existente
   * Cria cópia com novo nome e ID
   */
  async duplicateDimensioning(id: string, newName: string): Promise<LegacyDimensioningData> {
    try {
      // Buscar dimensionamento original
      const original = await this.getDimensioningById(id);
      
      // Preparar cópia sem ID e com novo nome
      const duplicate: LegacyDimensioningData = {
        ...original,
        dimensioningName: newName,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined
      };

      // Salvar como novo dimensionamento
      const result = await this.saveDimensioning(duplicate);
      
      return {
        ...duplicate,
        id: result.id,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };

    } catch (error) {
      this.handleError(error, 'duplicateDimensioning');
    }
  }

  /**
   * Obtém token de autenticação do storage
   * Verifica localStorage e sessionStorage
   */
  private getAuthToken(): string {
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    
    if (!token) {
      throw new Error('Usuário não autenticado');
    }
    
    return token;
  }

  /**
   * Valida se usuário tem permissão para operação
   * Verifica se dimensionamento pertence ao usuário
   */
  private async validateOwnership(dimensioningId: string): Promise<boolean> {
    try {
      const dimensioning = await this.getDimensioningById(dimensioningId);
      // TODO: Implementar validação de ownership baseada no usuário atual
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance para uso na aplicação
export const dimensioningService = DimensioningService.getInstance();