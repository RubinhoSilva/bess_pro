import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { IManufacturerRepository } from '../../../domain/repositories/IManufacturerRepository';
import { GetInvertersQuery } from '../../dtos/input/equipment/GetInvertersQuery';
import { InverterListResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';

export class GetInvertersUseCase implements IUseCase<GetInvertersQuery, Result<InverterListResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository,
    private manufacturerRepository: IManufacturerRepository
  ) {}

  async execute(query: GetInvertersQuery): Promise<Result<InverterListResponseDto>> {
    try {
      const { 
        teamId,
        page = 1, 
        pageSize = 20, 
        search,
        fabricante,
        tipoRede,
        potenciaMin,
        potenciaMax,
        moduleReferencePower
      } = query;

      const { inverters, total } = await this.inverterRepository.findByFilters({
        teamId,
        search,
        fabricante,
        tipoRede,
        potenciaMin,
        potenciaMax,
        page,
        pageSize
      });

      // Obter todos os IDs de fabricantes únicos para busca em lote
      const manufacturerIds = [...new Set(
        inverters
          .map(inverter => inverter.manufacturerId)
          .filter(id => id !== undefined) as string[]
      )];
      
      // Buscar todos os fabricantes em lote se houver IDs
      let manufacturerMap: Map<string, string> | undefined;
      if (manufacturerIds.length > 0) {
        const manufacturers = await Promise.all(
          manufacturerIds.map(async id => {
            const manufacturer = await this.manufacturerRepository.findById(id);
            return { id, name: manufacturer?.name || 'Fabricante não encontrado' };
          })
        );
        
        // Criar mapa de fabricantes para acesso rápido
        manufacturerMap = new Map(
          manufacturers.map(m => [m.id, m.name])
        );
      }
      
      const responseDto = InverterMapper.toListResponseDto(
        inverters,
        total,
        page,
        pageSize,
        manufacturerMap,
        moduleReferencePower
      );
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao buscar inversores');
    }
  }
}