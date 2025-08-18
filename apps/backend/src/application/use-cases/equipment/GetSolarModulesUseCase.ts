import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { GetSolarModulesQuery } from '../../dtos/input/equipment/GetSolarModulesQuery';
import { SolarModuleListResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';

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
        search,
        fabricante,
        tipoCelula,
        potenciaMin,
        potenciaMax
      } = query;

      const { modules, total } = await this.solarModuleRepository.findByFilters({
        userId,
        search,
        fabricante,
        tipoCelula,
        potenciaMin,
        potenciaMax,
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