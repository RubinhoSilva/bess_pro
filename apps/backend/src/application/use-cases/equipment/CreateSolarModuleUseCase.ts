import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { ISolarModuleRepository } from '../../../domain/repositories/ISolarModuleRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { SolarModule } from '../../../domain/entities/SolarModule';
import { CreateModuleRequest } from '@bess-pro/shared';
import { SolarModuleResponseDto } from '../../dtos/output/SolarModuleResponseDto';
import { SolarModuleMapper } from '../../mappers/SolarModuleMapper';
import { SharedToSolarModuleMapper } from '../../mappers/SharedToSolarModuleMapper';

export class CreateSolarModuleUseCase implements IUseCase<CreateModuleRequest & { userId: string }, Result<SolarModuleResponseDto>> {
   
  constructor(
    private solarModuleRepository: ISolarModuleRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(request: CreateModuleRequest & { userId: string }): Promise<Result<SolarModuleResponseDto>> {
    try {
      // Validar se o fabricante existe
      const manufacturerId = request.manufacturer;
      if (!manufacturerId) {
        return Result.failure('ID do fabricante é obrigatório');
      }

      const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
      if (!manufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar se já existe um módulo com mesmo fabricante/modelo para o usuário
      const existingModule = await this.solarModuleRepository.findByManufacturerModelo(
        manufacturerId,
        request.model,
        request.userId
      );

      if (existingModule) {
        return Result.failure(`Já existe um módulo ${manufacturer.name} ${request.model} cadastrado.`);
      }

      // Converter request para o formato da entidade
      const moduleData = SharedToSolarModuleMapper.createRequestToEntityData(request);
      
      // Criar nova instância do módulo
      const module = new SolarModule(moduleData);
      
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