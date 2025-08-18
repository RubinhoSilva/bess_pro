import { Project } from '../../domain/entities/Project';
import { ProjectResponseDto, ProjectSummaryDto } from '../dtos/output/ProjectResponseDto';
import { ProjectDomainService } from '../../domain/services/ProjectDomainService';

export class ProjectMapper {
  static toResponseDto(project: Project): ProjectResponseDto {
    const location = project.getLocation();
    
    return {
      id: project.getId(),
      projectName: project.getProjectName().getValue(),
      projectType: project.getProjectType(),
      userId: project.getUserId().getValue(),
      address: project.getAddress(),
      leadId: project.getLeadId(),
      savedAt: project.getSavedAt().toISOString(),
      hasLocation: project.hasLocation(),
      location: location ? {
        latitude: location.getLatitude(),
        longitude: location.getLongitude(),
      } : undefined,
      projectData: project.getProjectData(),
      priority: ProjectDomainService.calculateProjectPriority(project),
    };
  }

  static toSummaryDto(project: Project): ProjectSummaryDto {
    return {
      id: project.getId(),
      projectName: project.getProjectName().getValue(),
      projectType: project.getProjectType(),
      address: project.getAddress(),
      savedAt: project.getSavedAt().toISOString(),
      hasLocation: project.hasLocation(),
      hasLead: !!project.getLeadId(),
    };
  }

  static toSummaryDtoList(projects: Project[]): ProjectSummaryDto[] {
    return projects.map(project => this.toSummaryDto(project));
  }

  static toResponseDtoList(projects: Project[]): ProjectResponseDto[] {
    return projects.map(project => this.toResponseDto(project));
  }
}