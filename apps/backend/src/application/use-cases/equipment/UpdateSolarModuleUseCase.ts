import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { SolarModule } from '../../../domain/entities/SolarModule';
import { UpdateModuleRequest } from '@bess-pro/shared';
import { SolarModuleResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';
import { SharedToSolarModuleMapper } from '../../mappers/SharedToSolarModuleMapper';

export class UpdateSolarModuleUseCase implements IUseCase<UpdateModuleRequest & { userId: string }, Result<SolarModuleResponseDto>> {
   
  constructor(
    private solarModuleRepository: ISolarModuleRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: UpdateModuleRequest & { userId: string }): Promise<Result<SolarModuleResponseDto>> {
    try {
      const { userId, id } = request;
      
      // Verificar se o módulo existe e pertence ao usuário
      const existingModule = await this.solarModuleRepository.findById(id);
      if (!existingModule || existingModule.userId !== userId) {
        return Result.failure('Módulo solar não encontrado');
      }

      // Validar novo fabricante se estiver sendo alterado
      const manufacturerId = request.manufacturer;
      if (manufacturerId) {
        const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      }

      // Se mudou fabricante/modelo, verificar duplicação
      if (request.manufacturer || request.model) {
        const manufacturerIdToCheck = request.manufacturer || existingModule.manufacturerId;
        const modelo = request.model || existingModule.modelo;
        
        const duplicateModule = await this.solarModuleRepository.findByManufacturerModelo(
          manufacturerIdToCheck,
          modelo,
          userId
        );
        
        if (duplicateModule && duplicateModule.id !== id) {
          const manufacturer = await this.manufacturerRepository.findById(manufacturerIdToCheck);
          const manufacturerName = manufacturer?.name || 'Desconhecido';
          return Result.failure(`Já existe um módulo ${manufacturerName} ${modelo} cadastrado.`);
        }
      }

      // Converter request para o formato da entidade
      const updateData = SharedToSolarModuleMapper.updateRequestToEntityData(request);

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