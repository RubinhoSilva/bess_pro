import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { Inverter } from '../../../domain/entities/Inverter';
import { CreateInverterCommand } from '../../dtos/input/equipment/CreateInverterCommand';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';

export class CreateInverterUseCase implements IUseCase<CreateInverterCommand, Result<InverterResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: CreateInverterCommand): Promise<Result<InverterResponseDto>> {
    try {
      // Validar se o fabricante existe
      const manufacturer = await this.manufacturerRepository.findById(command.manufacturerId);
      if (!manufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se já existe um inversor com mesmo fabricante/modelo para o usuário
      const existingInverter = await this.inverterRepository.findByFabricanteModelo(
        command.fabricante,
        command.modelo,
        command.userId
      );

      if (existingInverter) {
        return Result.failure(`Já existe um inversor ${command.fabricante} ${command.modelo} cadastrado.`);
      }

      // Criar nova instância do inversor
      const inverter = new Inverter(command);
      
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