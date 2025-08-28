import { IClientRepository } from '../../../domain/repositories/IClientRepository';
import { ILeadRepository } from '../../../domain/repositories/ILeadRepository';
import { Result } from '../../common/Result';
import { Lead, LeadStage, ClientType } from '../../../domain/entities/Lead';
import { UserId } from '../../../domain/value-objects/UserId';
import { Email } from '../../../domain/value-objects/Email';

export interface RevertClientToLeadCommand {
  clientId: string;
}

export class RevertClientToLeadUseCase {
  constructor(
    private clientRepository: IClientRepository,
    private leadRepository: ILeadRepository
  ) {}

  async execute(command: RevertClientToLeadCommand, userId: string): Promise<Result<Lead>> {
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

      // Verificar se o cliente foi convertido de um lead
      if (!client.getTags().includes('convertido-de-lead')) {
        return Result.failure('Este cliente não foi convertido de um lead');
      }

      // Verificar se já existe um lead ativo com o mesmo email
      const existingLead = await this.leadRepository.findByEmail(client.getEmail(), userIdObj);
      
      // Se existe um lead e ele não é o lead original convertido, retornar erro
      if (existingLead && existingLead.getStage() !== LeadStage.CONVERTED) {
        return Result.failure('Já existe um lead ativo com este email');
      }
      
      // Se é o lead original convertido, vamos reutilizá-lo em vez de criar um novo
      let leadToUpdate: Lead | null = null;
      if (existingLead && existingLead.getStage() === LeadStage.CONVERTED) {
        leadToUpdate = existingLead;
      }

      // Extrair data de conversão das notas (se existir)
      let originalConversionDate: Date | null = null;
      const clientNotes = client.getNotes();
      if (clientNotes) {
        const match = clientNotes.match(/Cliente convertido do lead em (\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2})/);
        if (match) {
          const [day, month, year, hour, minute, second] = match[1].split(/[\/,: ]/).filter(Boolean);
          originalConversionDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
          );
        }
      }

      let savedLead: Lead;
      
      if (leadToUpdate) {
        // Reutilizar o lead original convertido
        leadToUpdate.updateStage(LeadStage.PRE_QUALIFICACAO);
        leadToUpdate.updateNotes(
          `Lead revertido do cliente em ${new Date().toLocaleString('pt-BR')}` + 
          (originalConversionDate ? `. Originalmente convertido em ${originalConversionDate.toLocaleString('pt-BR')}` : '')
        );
        const existingTags = leadToUpdate.getTags();
        const updatedTags = [...existingTags, 'revertido-de-cliente'];
        leadToUpdate.updateTags(updatedTags);
        
        savedLead = await this.leadRepository.save(leadToUpdate);
      } else {
        // Criar novo lead a partir dos dados do cliente
        const leadData = {
          name: client.getName().getValue(),
          email: client.getEmail().getValue(),
          phone: client.getPhone() || '',
          company: client.getCompany() || '',
          address: client.getAddress() || '',
          clientType: client.getClientType() === 'commercial' ? ClientType.B2B : ClientType.B2C,
          stage: LeadStage.PRE_QUALIFICACAO, // Voltar para um estágio ativo
          estimatedValue: client.getTotalProjectsValue() || undefined,
          notes: `Lead revertido do cliente em ${new Date().toLocaleString('pt-BR')}` + 
                 (originalConversionDate ? `. Originalmente convertido em ${originalConversionDate.toLocaleString('pt-BR')}` : ''),
          tags: ['revertido-de-cliente'],
          userId: userId,
          createdAt: originalConversionDate || new Date(), // Preservar data original se possível
          updatedAt: new Date()
        };

        // Criar o lead
        const lead = Lead.create(leadData);
        savedLead = await this.leadRepository.save(lead);
      }

      // Remover o cliente
      await this.clientRepository.delete(command.clientId);

      return Result.success(savedLead);
    } catch (error: any) {
      console.error('Erro ao reverter cliente para lead:', error);
      return Result.failure(error.message || 'Erro interno do servidor');
    }
  }
}