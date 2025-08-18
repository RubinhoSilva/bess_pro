import { Project, ProjectType } from '../../../../domain/entities/Project';
import { ProjectDocument } from '../schemas/ProjectSchema';
import { Types } from 'mongoose';

export class ProjectDbMapper {
  static toDomain(doc: ProjectDocument): Project {
    return Project.create({
      id: doc._id.toString(),
      projectName: doc.projectName,
      userId: doc.userId.toString(),
      projectType: doc.projectType as ProjectType,
      address: doc.address,
      leadId: doc.leadId?.toString(),
      projectData: doc.projectData,
      isDeleted: doc.isDeleted,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  static toDbDocument(project: Project): Partial<ProjectDocument> {
    const projectId = project.getId();
    const userId = project.getUserId().getValue();
    const leadId = project.getLeadId();

    return {
      _id: Types.ObjectId.isValid(projectId) ? new Types.ObjectId(projectId) : new Types.ObjectId(),
      projectName: project.getProjectName().getValue(),
      projectData: project.getProjectData(),
      savedAt: project.getSavedAt(),
      userId: Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId(),
      projectType: project.getProjectType(),
      address: project.getAddress(),
      leadId: leadId && Types.ObjectId.isValid(leadId) ? new Types.ObjectId(leadId) : undefined,
      isDeleted: project.isDeleted(),
      deletedAt: project.getDeletedAt() || undefined,
    };
  }

  static toDbUpdate(project: Project): Partial<ProjectDocument> {
    const leadId = project.getLeadId();
    
    return {
      projectName: project.getProjectName().getValue(),
      projectData: project.getProjectData(),
      savedAt: project.getSavedAt(),
      address: project.getAddress(),
      leadId: leadId && Types.ObjectId.isValid(leadId) ? new Types.ObjectId(leadId) : undefined,
      isDeleted: project.isDeleted(),
      deletedAt: project.getDeletedAt() || undefined,
      updatedAt: new Date(),
    };
  }
}