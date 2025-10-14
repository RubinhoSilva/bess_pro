import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { UpdateInverterRequest } from '@bess-pro/shared';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';
import { SharedToInverterMapper } from '../../mappers/SharedToInverterMapper';

export class UpdateInverterUseCase implements IUseCase<UpdateInverterRequest & { teamId: string }, Result<InverterResponseDto>> {
   
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: UpdateInverterRequest & { teamId: string }): Promise<Result<InverterResponseDto>> {
    try {
      const { teamId, id, ...updateData } = request;
      
      // Verificar se o inversor existe e pertence ao time
      const existingInverter = await this.inverterRepository.findById(id);
      if (!existingInverter || existingInverter.teamId !== teamId) {
        return Result.failure('Inversor não encontrado');
      }

      // Validar fabricante se estiver sendo alterado
      if ((updateData as any).manufacturer?.id) {
        const manufacturer = await this.manufacturerRepository.findById((updateData as any).manufacturer.id);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      } else if (updateData.manufacturerId) {
        const manufacturer = await this.manufacturerRepository.findById(updateData.manufacturerId);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      }

      // Converter dados compartilhados para formato da entidade  
      console.log('UpdateInverterUseCase - updateData:', JSON.stringify(updateData, null, 2));
      
      const entityUpdateData = SharedToInverterMapper.updateRequestToEntityData({
        ...updateData,
        teamId,
        id // Add missing id property
      } as any);
      
      console.log('UpdateInverterUseCase - entityUpdateData:', JSON.stringify(entityUpdateData, null, 2));

      // Se mudou manufacturerId/modelo, verificar duplicação
      if (entityUpdateData.manufacturerId || entityUpdateData.modelo) {
        const manufacturerId = entityUpdateData.manufacturerId || existingInverter.manufacturerId;
        const modelo = entityUpdateData.modelo || existingInverter.modelo;
        
        // Buscar por manufacturerId e modelo
        const duplicateInverter = await this.inverterRepository.findByManufacturerIdAndModel(
          manufacturerId,
          modelo,
          teamId
        );
        
        if (duplicateInverter && duplicateInverter.id !== id) {
          return Result.failure(`Já existe um inversor com este modelo cadastrado.`);
        }
      }

      // Atualizar dados
      const existingData = existingInverter.toJSON();
      console.log('UpdateInverterUseCase - existingData:', JSON.stringify(existingData, null, 2));
      
      const updatedData = {
        ...existingData,
        ...entityUpdateData,
        updatedAt: new Date()
      };
      
      console.log('UpdateInverterUseCase - merged updatedData:', JSON.stringify(updatedData, null, 2));
      
      // Verificar se há realmente mudanças
      const hasChanges = JSON.stringify(existingData) !== JSON.stringify({...existingData, ...entityUpdateData, updatedAt: existingData.updatedAt});
      console.log('UpdateInverterUseCase - hasChanges:', hasChanges);

      console.log('UpdateInverterUseCase - updatedData before save:', JSON.stringify(updatedData, null, 2));
      
      const updatedInverter = new Inverter(updatedData);
      const savedInverter = await this.inverterRepository.update(id, updatedInverter.toJSON());
      
      console.log('UpdateInverterUseCase - savedInverter:', savedInverter);
      
      if (!savedInverter) {
        return Result.failure('Erro ao atualizar inversor');
      }
      
      const responseDto = InverterMapper.toResponseDto(savedInverter);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao atualizar inversor');
    }
  }
}