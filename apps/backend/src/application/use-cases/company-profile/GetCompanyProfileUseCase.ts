import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";

export class GetCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(teamId: string): Promise<Result<CompanyProfileResponseDto | null>> {
    try {
      const companyProfile = await this.companyProfileRepository.findByTeamId(teamId);

      if (!companyProfile) {
        return Result.success(null);
      }

      const responseDto = CompanyProfileMapper.toResponseDto(companyProfile);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}