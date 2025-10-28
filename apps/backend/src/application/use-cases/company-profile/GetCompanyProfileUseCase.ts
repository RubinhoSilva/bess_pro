import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";

export class GetCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(companyProfileId: string): Promise<Result<CompanyProfileResponseDto>> {
    try {
      const companyProfile = await this.companyProfileRepository.findById(companyProfileId);

      if (!companyProfile) {
        return Result.failure('Perfil da empresa não encontrado');
      }

      const responseDto = CompanyProfileMapper.toResponseDto(companyProfile);
      return Result.success(responseDto);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}