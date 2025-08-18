import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { CreateLeadInteractionUseCase } from '@/application/use-cases/lead-interaction/CreateLeadInteractionUseCase';
import { GetLeadInteractionsUseCase } from '@/application/use-cases/lead-interaction/GetLeadInteractionsUseCase';
import { UpdateLeadInteractionUseCase } from '@/application/use-cases/lead-interaction/UpdateLeadInteractionUseCase';
import { DeleteLeadInteractionUseCase } from '@/application/use-cases/lead-interaction/DeleteLeadInteractionUseCase';
import { LeadInteractionMapper } from '@/application/mappers/LeadInteractionMapper';
import { CreateLeadInteractionRequestDTO, UpdateLeadInteractionRequestDTO } from '@/application/dtos/LeadInteractionDTO';
import { InteractionType, InteractionDirection } from '@/domain/entities/LeadInteraction';

export class LeadInteractionController extends BaseController {
  constructor(
    private createLeadInteractionUseCase: CreateLeadInteractionUseCase,
    private getLeadInteractionsUseCase: GetLeadInteractionsUseCase,
    private updateLeadInteractionUseCase: UpdateLeadInteractionUseCase,
    private deleteLeadInteractionUseCase: DeleteLeadInteractionUseCase
  ) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.extractUserId(req);

      const dto: CreateLeadInteractionRequestDTO = req.body;
      
      const result = await this.createLeadInteractionUseCase.execute({
        leadId: dto.leadId,
        userId,
        type: dto.type,
        direction: dto.direction,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        metadata: dto.metadata
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const interactionDTO = LeadInteractionMapper.toDTO(result.value!);
      this.created(res, interactionDTO);
    } catch (error) {
      if (error instanceof Error && error.message === 'Usuário não autenticado') {
        this.unauthorized(res);
        return;
      }
      this.internalServerError(res);
    }
  }

  async getByLeadId(req: Request, res: Response): Promise<void> {
    try {
      const { leadId } = req.params;
      
      const result = await this.getLeadInteractionsUseCase.execute({ leadId });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const interactionsDTO = LeadInteractionMapper.toDTOList(result.value!);
      this.ok(res, interactionsDTO);
    } catch (error) {
      this.internalServerError(res);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: UpdateLeadInteractionRequestDTO = req.body;
      
      const result = await this.updateLeadInteractionUseCase.execute({
        id,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        metadata: dto.metadata
      });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      const interactionDTO = LeadInteractionMapper.toDTO(result.value!);
      this.ok(res, interactionDTO);
    } catch (error) {
      this.internalServerError(res);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const result = await this.deleteLeadInteractionUseCase.execute({ id });

      if (!result.isSuccess) {
        this.badRequest(res, result.error!);
        return;
      }

      this.ok(res, { message: 'Lead interaction deleted successfully' });
    } catch (error) {
      this.internalServerError(res);
    }
  }
}