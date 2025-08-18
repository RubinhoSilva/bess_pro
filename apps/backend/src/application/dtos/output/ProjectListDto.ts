import { ProjectSummaryDto } from "./ProjectSummaryDto";

export interface ProjectListDto {
  projects: ProjectSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}
