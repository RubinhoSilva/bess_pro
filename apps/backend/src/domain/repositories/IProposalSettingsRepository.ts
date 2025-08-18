import { ProposalSettings } from '../entities/ProposalSettings';
import { UserId } from '../value-objects/UserId';

export interface IProposalSettingsRepository {
  save(proposalSettings: ProposalSettings): Promise<ProposalSettings>;
  findByUserId(userId: UserId): Promise<ProposalSettings | null>;
  update(proposalSettings: ProposalSettings): Promise<ProposalSettings>;
  delete(id: string): Promise<void>;
}