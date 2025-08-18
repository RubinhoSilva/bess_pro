import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { SolarModule } from '../../../domain/entities/SolarModule';
import { UpdateSolarModuleCommand } from '../../dtos/input/equipment/UpdateSolarModuleCommand';
import { SolarModuleResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';

export class UpdateSolarModuleUseCase implements IUseCase<UpdateSolarModuleCommand, Result<SolarModuleResponseDto>> {
  
  constructor(
    private solarModuleRepository: ISolarModuleRepository
  ) {}

  async execute(command: UpdateSolarModuleCommand): Promise<Result<SolarModuleResponseDto>> {
    try {
      const { userId, id, ...updateData } = command;
      
      // Verificar se o módulo existe e pertence ao usuário
      const existingModule = await this.solarModuleRepository.findById(id);
      if (!existingModule || existingModule.userId !== userId) {
        return Result.failure('Módulo solar não encontrado');
      }

      // Se mudou fabricante/modelo, verificar duplicação
      if (updateData.fabricante || updateData.modelo) {
        const fabricante = updateData.fabricante || existingModule.fabricante;
        const modelo = updateData.modelo || existingModule.modelo;
        
        const duplicateModule = await this.solarModuleRepository.findByFabricanteModelo(
          fabricante,
          modelo,
          userId
        );
        
        if (duplicateModule && duplicateModule.id !== id) {
          return Result.failure(`Já existe um módulo ${fabricante} ${modelo} cadastrado.`);
        }
      }

      // Atualizar dados
      const updatedData = {
        ...existingModule.toJSON(),
        ...updateData,
        updatedAt: new Date()
      };

      const updatedModule = new SolarModule(updatedData);
      const savedModule = await this.solarModuleRepository.update(id, updatedModule.toJSON());
      
      if (!savedModule) {
        return Result.failure('Erro ao atualizar módulo solar');
      }
      
      const responseDto = SolarModuleMapper.toResponseDto(savedModule);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao atualizar módulo solar');
    }
  }
}