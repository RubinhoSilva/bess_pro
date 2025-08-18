export interface CreateAreaMontagemCommand {
  projectId: string;
  userId: string;
  nome: string;
  coordinates?: Record<string, any>;
}