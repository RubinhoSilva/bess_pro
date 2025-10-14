import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { CreateInverterRequest } from '@bess-pro/shared';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';
import { SharedToInverterMapper } from '../../mappers/SharedToInverterMapper';

export class CreateInverterUseCase implements IUseCase<CreateInverterRequest & { teamId: string }, Result<InverterResponseDto>> {
   
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: CreateInverterRequest & { teamId: string }): Promise<Result<InverterResponseDto>> {
    try {
      // Validar se o fabricante existe
      const manufacturerId = request.manufacturerId ;
      if (manufacturerId) {
        const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      }

      // Verificar se já existe um inversor com mesmo manufacturerId/modelo para o time
      const existingInverter = await this.inverterRepository.findByManufacturerIdAndModel(
        request.manufacturerId,
        request.model,
        request.teamId
      );

      if (existingInverter) {
        return Result.failure(`Já existe um inversor com este modelo cadastrado.`);
      }

      // Converter request para o formato da entidade
      const inverterData = SharedToInverterMapper.createRequestToEntityData(request);
      
      // Criar nova instância do inversor
      const inverter = new Inverter(inverterData);
      
      // Salvar no repositório
      const savedInverter = await this.inverterRepository.create(inverter.toJSON());
      
      // Converter para DTO de resposta
      const responseDto = InverterMapper.toResponseDto(savedInverter);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao criar inversor');
    }
  }
}