import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { ModuleFilters } from '@bess-pro/shared';
import { SolarModuleListResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';

interface GetSolarModulesQuery extends ModuleFilters {
  userId: string;
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
        userId,
        page = 1, 
        pageSize = 20,
        searchTerm,
        manufacturerId,
        cellType,
        minPower,
        maxPower
      } = query;

      const { modules, total } = await this.solarModuleRepository.findByFilters({
        userId,
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