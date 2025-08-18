import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Result } from '../../common/Result';
import { Client } from '../../../domain/entities/Client';
import { LeadStage } from '../../../domain/entities/Lead';
import { UserId } from '../../../domain/value-objects/UserId';

export interface ConvertLeadToClientCommand {
  leadId: string;
}

export class ConvertLeadToClientUseCase {
  constructor(
    private clientRepository: IClientRepository,
    private leadRepository: ILeadRepository
  ) {}

  async execute(command: ConvertLeadToClientCommand, userId: string): Promise<Result<Client>> {
    try {
      // Buscar o lead
      const lead = await this.leadRepository.findById(command.leadId);
      if (!lead) {
        return Result.failure('Lead não encontrado');
      }

      // Verificar se o lead pertence ao usuário
      const userIdObj = UserId.create(userId);
      if (!lead.isOwnedBy(userIdObj)) {
        return Result.failure('Acesso negado');
      }

      // Verificar se já existe um cliente com o mesmo email
      const existingClient = await this.clientRepository.findByEmail(lead.getEmail().getValue(), userId);
      if (existingClient) {
        return Result.failure('Já existe um cliente com este email');
      }

      // Criar cliente a partir dos dados do lead
      const clientData = {
        name: lead.getName().getValue(),
        email: lead.getEmail().getValue(),
        phone: lead.getPhone(),
        company: lead.getCompany(),
        address: lead.getAddress(),
        status: 'active' as const,
        clientType: lead.getClientType() === 'B2B' ? 'commercial' as const : 'residential' as const,
        notes: lead.getNotes() || `Cliente convertido do lead em ${new Date().toLocaleString('pt-BR')}`,
        tags: ['convertido-de-lead'],
        totalProjectsValue: lead.getEstimatedValue() || undefined,
        lastContactDate: new Date(),
        nextFollowUpDate: null
      };

      // Criar o cliente
      const client = await this.clientRepository.create(clientData, userId);

      // Marcar o lead como convertido (atualizar stage)
      await this.leadRepository.updateStage(command.leadId, LeadStage.CONVERTED);

      return Result.success(client);
    } catch (error: any) {
      console.error('Erro ao converter lead em cliente:', error);
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}