import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { Result } from "../../common/Result";

export class DeleteCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository
  ) {}

  async execute(companyProfileId: string, hardDelete: boolean = false): Promise<Result<void>> {
    try {
      const companyProfile = await this.companyProfileRepository.findById(companyProfileId);

      if (!companyProfile) {
        return Result.failure('Perfil da empresa não encontrado');
      }

      if (hardDelete) {
        // Hard delete - remoção permanente
        await this.companyProfileRepository.delete(companyProfileId);
      } else {
        // Soft delete - apenas marca como excluído
        await this.companyProfileRepository.softDelete(companyProfileId);
      }

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}