import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { UpdateInverterCommand } from '../../dtos/input/equipment/UpdateInverterCommand';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';

export class UpdateInverterUseCase implements IUseCase<UpdateInverterCommand, Result<InverterResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository
  ) {}

  async execute(command: UpdateInverterCommand): Promise<Result<InverterResponseDto>> {
    try {
      const { userId, id, ...updateData } = command;
      
      // Verificar se o inversor existe e pertence ao usuário
      const existingInverter = await this.inverterRepository.findById(id);
      if (!existingInverter || existingInverter.userId !== userId) {
        return Result.failure('Inversor não encontrado');
      }

      // Se mudou fabricante/modelo, verificar duplicação
      if (updateData.fabricante || updateData.modelo) {
        const fabricante = updateData.fabricante || existingInverter.fabricante;
        const modelo = updateData.modelo || existingInverter.modelo;
        
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
        ...updateData,
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