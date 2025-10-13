import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { PaginatedManufacturersResponseDto } from "@/application/dtos/output/PaginatedManufacturersResponseDto";
import { ManufacturerMapper } from "@/application/mappers/ManufacturerMapper";
import { ManufacturerType } from "@/domain/entities/Manufacturer";
import { 
  IManufacturerRepository, 
  ManufacturerFilters, 
  ManufacturerPaginationOptions 
} from "@/domain/repositories/IManufacturerRepository";

export interface GetManufacturersCommand {
  teamId?: string;
  type?: ManufacturerType;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class GetManufacturersUseCase implements IUseCase<GetManufacturersCommand, Result<PaginatedManufacturersResponseDto>> {
  constructor(
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: GetManufacturersCommand): Promise<Result<PaginatedManufacturersResponseDto>> {
    try {
      const filters: ManufacturerFilters = {
        type: command.type,
        search: command.search,
        teamId: command.teamId
      };

      console.log('GetManufacturersUseCase filters:', filters);

      const pagination: ManufacturerPaginationOptions = {
        page: command.page || 1,
        limit: command.limit || 20,
        sortBy: command.sortBy || 'name',
        sortOrder: command.sortOrder || 'asc'
      };

      console.log('GetManufacturersUseCase pagination:', pagination);

      const result = await this.manufacturerRepository.findPaginated(filters, pagination);

      const response: PaginatedManufacturersResponseDto = {
        manufacturers: ManufacturerMapper.toResponseDtoList(result.manufacturers),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev
        }
      };

      return Result.success(response);
    } catch (error: any) {
      return Result.failure(`Erro ao buscar fabricantes: ${error.message}`);
    }
  }
}