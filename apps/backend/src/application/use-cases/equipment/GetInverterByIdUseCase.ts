import { IUseCase } from '../../common/IUseCase';
import { Result } from '../../common/Result';
import { IInverterRepository } from '../../../domain/repositories/IInverterRepository';
import { GetInverterByIdQuery } from '../../dtos/input/equipment/GetInverterByIdQuery';
import { InverterResponseDto } from '../../dtos/output/InverterResponseDto';
import { InverterMapper } from '../../mappers/InverterMapper';
import { SystemUsers } from '../../../domain/constants/SystemUsers';

export class GetInverterByIdUseCase implements IUseCase<GetInverterByIdQuery, Result<InverterResponseDto>> {
  
  constructor(
    private inverterRepository: IInverterRepository
  ) {}

  async execute(query: GetInverterByIdQuery): Promise<Result<InverterResponseDto>> {
    try {
      const { id, userId } = query;
      
      const inverter = await this.inverterRepository.findById(id);
      
      if (!inverter) {
        return Result.failure('Inversor não encontrado');
      }

      // Verificar se o inversor é público ou pertence ao usuário
      if (inverter.userId !== userId && inverter.userId !== SystemUsers.PUBLIC_EQUIPMENT) {
        return Result.failure('Inversor não encontrado');
      }
      
      const responseDto = InverterMapper.toResponseDto(inverter);
      
      return Result.success(responseDto);

    } catch (error) {
      if (error instanceof Error) {
        return Result.failure(error.message);
      }
      return Result.failure('Erro interno do servidor ao buscar inversor');
    }
  }
}