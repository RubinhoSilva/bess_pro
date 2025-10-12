import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { SolarModule } from '../../../domain/entities/SolarModule';
import { CreateSolarModuleCommand } from '../../dtos/input/equipment/CreateSolarModuleCommand';
import { SolarModuleResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';

export class CreateSolarModuleUseCase implements IUseCase<CreateSolarModuleCommand, Result<SolarModuleResponseDto>> {
  
  constructor(
    private solarModuleRepository: ISolarModuleRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(command: CreateSolarModuleCommand): Promise<Result<SolarModuleResponseDto>> {
    try {
      // Validar se o fabricante existe
      const manufacturer = await this.manufacturerRepository.findById(command.manufacturerId);
      if (!manufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se já existe um módulo com mesmo fabricante/modelo para o usuário
      const existingModule = await this.solarModuleRepository.findByFabricanteModelo(
        command.fabricante,
        command.modelo,
        command.userId
      );

      if (existingModule) {
        return Result.failure(`Já existe um módulo ${command.fabricante} ${command.modelo} cadastrado.`);
      }

      // Criar nova instância do módulo
      const module = new SolarModule(command);
      
      // Salvar no repositório
      const savedModule = await this.solarModuleRepository.create(module.toJSON());
      
      // Converter para DTO de resposta
      const responseDto = SolarModuleMapper.toResponseDto(savedModule);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao criar módulo solar');
    }
  }
}