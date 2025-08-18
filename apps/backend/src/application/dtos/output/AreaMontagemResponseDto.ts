export interface AreaMontagemResponseDto {
  id: string;
  projectId: string;
  userId: string;
  nome: string;
  coordinates: Record<string, any>;
  moduleLayout: Record<string, any>;
  moduleCount: number;
  hasModules: boolean;
  createdAt: string;
}
