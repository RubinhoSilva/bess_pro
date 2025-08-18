export interface ProjectStatsDto {
  total: number;
  byType: Record<string, number>;
  withLocation: number;
  withLead: number;
  avgPowerKWp: number;
  totalPowerKWp: number;
}