import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { ModuleFilters } from '@bess-pro/shared';
import { SolarModuleListResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';

interface GetSolarModulesQuery {
  filters?: ModuleFilters;
  page?: number;
  pageSize?: number;
}

export class GetSolarModulesUseCase implements IUseCase<GetSolarModulesQuery, Result<SolarModuleListResponseDto>> {
   
  constructor(
    private solarModuleRepository: ISolarModuleRepository
  ) {}

  async execute(query: GetSolarModulesQuery): Promise<Result<SolarModuleListResponseDto>> {
    try {
      const { 
        filters = {},
        page = 1, 
        pageSize = 20
      } = query;

      const {
        searchTerm,
        manufacturerId,
        cellType,
        minPower,
        maxPower,
        teamId
      } = filters;

      const { modules, total } = await this.solarModuleRepository.findByFilters({
        teamId,
        search: searchTerm,
        manufacturerId,
        tipoCelula: cellType,
        potenciaMin: minPower,
        potenciaMax: maxPower,
        page,
        pageSize
      });
      
      const responseDto = SolarModuleMapper.toListResponseDto(
        modules,
        total,
        page,
        pageSize
      );
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao buscar módulos solares');
    }
  }
}