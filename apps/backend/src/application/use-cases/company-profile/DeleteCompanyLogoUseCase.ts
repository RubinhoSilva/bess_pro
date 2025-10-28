import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";

export class DeleteCompanyLogoUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository,
    private s3Service: any // TODO: Tipar corretamente o serviço S3
  ) {}

  async execute(companyProfileId: string): Promise<Result<void>> {
    try {
      const companyProfile = await this.companyProfileRepository.findById(companyProfileId);

      if (!companyProfile) {
        return Result.failure('Perfil da empresa não encontrado');
      }

      const logoUrl = companyProfile.getLogoUrl();
      const logoPath = companyProfile.getLogoPath();
      
      if (!logoUrl || !logoPath) {
        return Result.failure('Nenhum logo encontrado para deletar');
      }

      // Deletar logo do S3
      await this.s3Service.deleteFile(logoPath);

      // Atualizar perfil removendo URL e path do logo
      companyProfile.updateLogoUrl('');
      companyProfile.updateLogoPath('');
      await this.companyProfileRepository.update(companyProfile);

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}