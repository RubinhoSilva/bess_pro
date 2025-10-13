import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { SolarModuleResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

interface GetSolarModuleByIdQuery {
  id: string;
  teamId: string;
}

export class GetSolarModuleByIdUseCase implements IUseCase<GetSolarModuleByIdQuery, Result<SolarModuleResponseDto>> {
  
  constructor(
    private solarModuleRepository: ISolarModuleRepository
  ) {}

  async execute(query: GetSolarModuleByIdQuery): Promise<Result<SolarModuleResponseDto>> {
    try {
      const { id, teamId } = query;
      
      const solarModule = await this.solarModuleRepository.findById(id);
      
      if (!solarModule) {
        return Result.failure('Módulo solar não encontrado');
      }

      // Verificar se o módulo é público ou pertence ao time
      if (solarModule.teamId !== teamId && !solarModule.isDefault) {
        return Result.failure('Módulo solar não encontrado');
      }
      
      const responseDto = SolarModuleMapper.toResponseDto(solarModule);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao buscar módulo solar');
    }
  }
}