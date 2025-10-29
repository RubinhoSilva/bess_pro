import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";
import { CompanyProfileResponseDto } from "../../dtos/output/CompanyProfileResponseDto";
import { CompanyProfileMapper } from "../../mappers/CompanyProfileMapper";
import type {
  UploadCompanyLogoRequest as SharedUploadCompanyLogoRequest,
  UploadCompanyLogoResponse as SharedUploadCompanyLogoResponse
} from "@bess-pro/shared";

// Re-export for backward compatibility
export type UploadCompanyLogoRequest = SharedUploadCompanyLogoRequest;
export type UploadCompanyLogoResponse = SharedUploadCompanyLogoResponse;

export class UploadCompanyLogoUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository,
    private s3Service: any // TODO: Tipar corretamente o serviço S3
  ) {}

  async execute(request: UploadCompanyLogoRequest): Promise<Result<UploadCompanyLogoResponse>> {
    try {
      const companyProfile = await this.companyProfileRepository.findById(request.companyProfileId);

      if (!companyProfile) {
        return Result.failure('Perfil da empresa não encontrado');
      }

      // Validar arquivo
      if (!request.file) {
        return Result.failure('Arquivo não fornecido');
      }

      // Validar tipo de arquivo (apenas imagens)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(request.file.mimetype)) {
        return Result.failure('Tipo de arquivo inválido. Apenas imagens são permitidas');
      }

      // Validar tamanho do arquivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (request.file.size > maxSize) {
        return Result.failure('Arquivo muito grande. Tamanho máximo permitido: 5MB');
      }

      // Salvar URL e path do logo anterior para possível deleção
      const previousLogoUrl = companyProfile.getLogoUrl();
      const previousLogoPath = companyProfile.getLogoPath();

      // Fazer upload do novo logo para S3
      const uploadResult = await this.s3Service.uploadLogo(request.file, 'company-logos');

      // Atualizar URL e path do logo no perfil
      companyProfile.updateLogoUrl(uploadResult.Location);
      companyProfile.updateLogoPath(uploadResult.Key);
      await this.companyProfileRepository.update(companyProfile);

      // Deletar logo anterior do S3 (se existir)
      if (previousLogoUrl && previousLogoPath) {
        try {
          await this.s3Service.deleteFile(previousLogoPath);
        } catch (error: any) {
          // Log do erro, mas não falhar a operação
          // Erro ao deletar logo anterior do S3: error.message
        }
      }

      return Result.success({
        logoUrl: uploadResult.Location,
        logoPath: uploadResult.Key,
        previousLogoUrl,
        previousLogoPath
      });

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}