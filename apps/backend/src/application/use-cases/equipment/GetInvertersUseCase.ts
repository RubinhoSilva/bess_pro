import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { GetInvertersQuery } from '../../dtos/input/equipment/GetInvertersQuery';
import { InverterListResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';

export class GetInvertersUseCase implements IUseCase<GetInvertersQuery, Result<InverterListResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository
  ) {}

  async execute(query: GetInvertersQuery): Promise<Result<InverterListResponseDto>> {
    try {
      const { 
        userId,
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
        userId,
        search,
        fabricante,
        tipoRede,
        potenciaMin,
        potenciaMax,
        page,
        pageSize
      });
      
      const responseDto = InverterMapper.toListResponseDto(
        inverters,
        total,
        page,
        pageSize,
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