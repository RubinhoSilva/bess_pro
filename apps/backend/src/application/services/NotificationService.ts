import { IUserRepository } from "@/domain/repositories";
import { IEmailService } from "./IEmailService";

export class NotificationService {
  constructor(
    private emailService: IEmailService,
    private userRepository: IUserRepository
  ) {}

  async notifyProjectCreated(projectId: string): Promise<void> {
    // Lógica para notificar criação de projeto
  }

  async notifyLeadConverted(leadId: string, projectId: string): Promise<void> {
    // Lógica para notificar conversão de lead
  }

  async notifyProjectShared(projectId: string, sharedWithEmail: string): Promise<void> {
    // Lógica para notificar compartilhamento
  }
}