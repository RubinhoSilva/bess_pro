import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { CreateInverterRequest } from '@bess-pro/shared';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';
import { SharedToInverterMapper } from '../../mappers/SharedToInverterMapper';

export class CreateInverterUseCase implements IUseCase<CreateInverterRequest & { userId: string }, Result<InverterResponseDto>> {
   
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: CreateInverterRequest & { userId: string }): Promise<Result<InverterResponseDto>> {
    try {
      // Validar se o fabricante existe
      const manufacturerId = (request.metadata as any)?.manufacturerId;
      if (manufacturerId) {
        const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
        if (!manufacturer) {
          return Result.failure('Fabricante não encontrado');
        }
      }

      // Verificar se já existe um inversor com mesmo fabricante/modelo para o usuário
      const manufacturerName = typeof request.manufacturer === 'string' ? request.manufacturer : request.manufacturer.name;
      const existingInverter = await this.inverterRepository.findByFabricanteModelo(
        manufacturerName,
        request.model,
        request.userId
      );

      if (existingInverter) {
        return Result.failure(`Já existe um inversor ${manufacturerName} ${request.model} cadastrado.`);
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