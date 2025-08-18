import { IProposalSettingsRepository } from '../../../domain/repositories/IProposalSettingsRepository';
import { ProposalSettings } from '../../../domain/entities/ProposalSettings';
import { UserId } from '../../../domain/value-objects/UserId';
import { Result } from '../../common/Result';

export interface GetProposalSettingsUseCaseRequest {
  userId: string;
}

export class GetProposalSettingsUseCase {
  constructor(
    private proposalSettingsRepository: IProposalSettingsRepository
  ) {}

  async execute(request: GetProposalSettingsUseCaseRequest): Promise<Result<ProposalSettings>> {
    try {
      const userId = UserId.create(request.userId);

      let proposalSettings = await this.proposalSettingsRepository.findByUserId(userId);

      // If no settings exist, create default settings
      if (!proposalSettings) {
        proposalSettings = ProposalSettings.createWithDefaults(request.userId);
        proposalSettings = await this.proposalSettingsRepository.save(proposalSettings);
      }

      return Result.success(proposalSettings);
    } catch (error) {
      console.error('GetProposalSettingsUseCase error:', error);
      return Result.failure('Erro interno do servidor');
    }
  }
}