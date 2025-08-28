import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Result } from '../../common/Result';
import { Lead, LeadStage, LeadSource, ClientType } from '../../../domain/entities/Lead';
import { UserId } from '../../../domain/value-objects/UserId';

export interface ConvertClientToLeadCommand {
  clientId: string;
  reason?: string; // Motivo da desconversão
  targetStage?: LeadStage; // Estágio para o qual o lead deve ir
}

export class ConvertClientToLeadUseCase {
  constructor(
    private clientRepository: IClientRepository,
    private leadRepository: ILeadRepository
  ) {}

  async execute(command: ConvertClientToLeadCommand, userId: string): Promise<Result<Lead>> {
    try {
      // Buscar o cliente
      const client = await this.clientRepository.findById(command.clientId);
      if (!client) {
        return Result.failure('Cliente não encontrado');
      }

      // Verificar se o cliente pertence ao usuário
      const userIdObj = UserId.create(userId);
      if (!client.isOwnedBy(userIdObj)) {
        return Result.failure('Acesso negado');
      }

      // Verificar se já existe um lead com o mesmo email
      const existingLead = await this.leadRepository.findByEmail(client.getEmail(), userIdObj);
      if (existingLead && !existingLead.isDeleted()) {
        return Result.failure('Já existe um lead ativo com este email');
      }

      // Criar lead a partir dos dados do cliente
      const leadData = {
        name: client.getName().getValue(),
        email: client.getEmail().getValue(),
        phone: client.getPhone(),
        company: client.getCompany(),
        address: client.getAddress(),
        stage: command.targetStage || LeadStage.QUARENTENA,
        source: LeadSource.OTHER,
        notes: [
          client.getNotes() || '',
          `\n--- Convertido de cliente em ${new Date().toLocaleString('pt-BR')} ---`,
          command.reason ? `Motivo: ${command.reason}` : ''
        ].filter(Boolean).join('\n'),
        colorHighlight: '',
        estimatedValue: client.getTotalProjectsValue() || 0,
        expectedCloseDate: undefined,
        value: client.getTotalProjectsValue() || 0,
        powerKwp: 0,
        clientType: client.getClientType() === 'commercial' ? ClientType.B2B : ClientType.B2C,
        tags: ['convertido-de-cliente', ...(client.getTags() || [])],
        userId: userId
      };

      // Criar o lead
      const lead = Lead.create(leadData);
      const savedLead = await this.leadRepository.save(lead);

      // Marcar o cliente como inativo (não deletar para manter histórico)
      await this.clientRepository.updateStatus(command.clientId, 'INACTIVE' as any);

      return Result.success(savedLead);
    } catch (error: any) {
      console.error('Erro ao converter cliente em lead:', error);
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}