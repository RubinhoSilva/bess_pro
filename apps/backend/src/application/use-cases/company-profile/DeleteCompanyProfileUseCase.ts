import { ICompanyProfileRepository } from "../../../domain/repositories/ICompanyProfileRepository";
import { ITeamRepository } from "../../../domain/repositories/ITeamRepository";
import { Result } from "../../common/Result";

export class DeleteCompanyProfileUseCase {
  constructor(
    private companyProfileRepository: ICompanyProfileRepository,
    private teamRepository: ITeamRepository
  ) {}

  async execute(teamId: string, hardDelete: boolean = false): Promise<Result<void>> {
    try {
      const companyProfile = await this.companyProfileRepository.findByTeamId(teamId);

      if (!companyProfile) {
        return Result.failure('Team não possui perfil para deletar');
      }

      // ANTES de deletar: Atualizar Team para companyProfileId = null
      const team = await this.teamRepository.findById(teamId);
      if (team) {
        team.removeCompanyProfile();
        await this.teamRepository.update(team.getId(), team);
      }

      if (hardDelete) {
        // Hard delete - remoção permanente
        await this.companyProfileRepository.delete(companyProfile.getId());
      } else {
        // Soft delete - apenas marca como excluído
        await this.companyProfileRepository.softDelete(companyProfile.getId());
      }

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}