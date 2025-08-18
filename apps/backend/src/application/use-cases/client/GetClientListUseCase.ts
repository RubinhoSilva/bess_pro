import { IClientRepository } from "../../../domain/repositories/IClientRepository";
import { Result } from "../../common/Result";
import { ClientResponseDto } from "../../dtos/output/ClientResponseDto";
import { ClientMapper } from "../../mappers/ClientMapper";
import { UserId } from "../../../domain/value-objects/UserId";

interface GetClientListQuery {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

interface ClientListResponse {
  clients: ClientResponseDto[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export class GetClientListUseCase {
  constructor(
    private clientRepository: IClientRepository
  ) {}

  async execute(query: GetClientListQuery, userId: string): Promise<Result<ClientListResponse>> {
    try {
      console.log('GetClientListUseCase - Input:', { query, userId });
      
      const page = query.page || 1;
      const pageSize = query.pageSize || 10;
      const userIdVO = UserId.create(userId);

      let result;
      
      if (query.searchTerm && query.searchTerm.trim()) {
        console.log('GetClientListUseCase - Searching with term:', query.searchTerm.trim());
        result = await this.clientRepository.search(userIdVO, query.searchTerm.trim(), page, pageSize);
      } else {
        console.log('GetClientListUseCase - Finding by userId');
        result = await this.clientRepository.findByUserId(userIdVO, page, pageSize);
      }

      console.log('GetClientListUseCase - Repository result:', { 
        clientsCount: result.clients.length, 
        total: result.total, 
        totalPages: result.totalPages 
      });

      const clientDtos = result.clients.map(client => ClientMapper.toResponseDto(client));

      const response: ClientListResponse = {
        clients: clientDtos,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: page
      };

      console.log('GetClientListUseCase - Final response:', response);
      return Result.success(response);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}