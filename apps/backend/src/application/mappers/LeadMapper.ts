import { Lead } from '../../domain/entities/Lead';
import { LeadResponseDto } from '../dtos/output/LeadResponseDto';

export class LeadMapper {
  static toResponseDto(lead: Lead, hasProject: boolean = false): LeadResponseDto {
    return {
      id: lead.getId(),
      name: lead.getName().getValue(),
      email: lead.getEmail().getValue(),
      phone: lead.getPhone(),
      company: lead.getCompany(),
      address: lead.getAddress(),
      stage: lead.getStage(),
      source: lead.getSource(),
      notes: lead.getNotes(),
      colorHighlight: lead.getColorHighlight(),
      estimatedValue: lead.getEstimatedValue(),
      expectedCloseDate: lead.getExpectedCloseDate()?.toISOString() || null,
      value: lead.getValue(),
      powerKwp: lead.getPowerKwp(),
      clientType: lead.getClientType(),
      tags: lead.getTags(),
      userId: lead.getUserId().getValue(),
      createdAt: lead.getCreatedAt().toISOString(),
      updatedAt: lead.getUpdatedAt().toISOString(),
      hasProject,
    };
  }

  static toResponseDtoList(leads: Lead[], projectMap: Map<string, boolean> = new Map()): LeadResponseDto[] {
    return leads.map(lead => this.toResponseDto(lead, projectMap.get(lead.getId()) || false));
  }
}