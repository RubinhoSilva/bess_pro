import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { UpdateInverterRequest } from '@bess-pro/shared';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';

export class UpdateInverterUseCase implements IUseCase<UpdateInverterRequest & { userId: string }, Result<InverterResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: UpdateInverterRequest & { userId: string }): Promise<Result<InverterResponseDto>> {
    try {
      const { userId, id, ...updateData } = request;
      
      // Verificar se o inversor existe e pertence ao usuário
      const existingInverter = await this.inverterRepository.findById(id);
      if (!existingInverter || existingInverter.userId !== userId) {
        return Result.failure('Inversor não encontrado');
      }

      // Validar novo fabricante se estiver sendo alterado
      if (updateData.manufacturer) {
        const manufacturer = await this.manufacturerRepository.findById(updateData.manufacturer.id);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      }

      // Converter dados compartilhados para formato da entidade  
      // TODO: Implement proper mapping later, using legacy format for now
      const entityUpdateData: any = {};

      // Se mudou fabricante/modelo, verificar duplicação
      if (entityUpdateData.fabricante || entityUpdateData.modelo) {
        const fabricante = entityUpdateData.fabricante || existingInverter.fabricante;
        const modelo = entityUpdateData.modelo || existingInverter.modelo;
        
        const duplicateInverter = await this.inverterRepository.findByFabricanteModelo(
          fabricante,
          modelo,
          userId
        );
        
        if (duplicateInverter && duplicateInverter.id !== id) {
          return Result.failure(`Já existe um inversor ${fabricante} ${modelo} cadastrado.`);
        }
      }

      // Atualizar dados
      const updatedData = {
        ...existingInverter.toJSON(),
        ...entityUpdateData,
        updatedAt: new Date()
      };

      const updatedInverter = new Inverter(updatedData);
      const savedInverter = await this.inverterRepository.update(id, updatedInverter.toJSON());
      
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