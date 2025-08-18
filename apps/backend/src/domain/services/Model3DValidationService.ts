import { Model3D } from "../entities/Model3D";
import { Project } from "../entities/Project";
import { ProjectId } from "../value-objects/ProjectId";

export class Model3DValidationService {
  private static readonly SUPPORTED_FORMATS = ['.obj', '.gltf', '.glb', '.fbx'];
  private static readonly MAX_FILE_SIZE_MB = 100;

  /**
   * Valida se um modelo 3D é válido para o projeto
   */
  static validateModel(model: Model3D, project: Project): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Verificar se pertence ao projeto
    if (!model.belongsToProject(ProjectId.create(project.getId()))) {
      errors.push('Modelo não pertence ao projeto especificado');
    }

    // Verificar formato
    if (!this.isSupportedFormat(model.getModelPath())) {
      errors.push('Formato de arquivo não suportado');
    }

    // Verificar se o nome é descritivo
    if (model.getName().getValue().length < 3) {
      errors.push('Nome do modelo deve ter pelo menos 3 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Verifica se o formato do arquivo é suportado
   */
  static isSupportedFormat(filePath: string): boolean {
    const extension = this.getFileExtension(filePath);
    return this.SUPPORTED_FORMATS.includes(extension);
  }

  /**
   * Valida o tamanho do arquivo
   */
  static validateFileSize(fileSizeMB: number): boolean {
    return fileSizeMB <= this.MAX_FILE_SIZE_MB;
  }

  /**
   * Sugere otimizações para o modelo
   */
  static suggestOptimizations(model: Model3D): string[] {
    const suggestions: string[] = [];
    const extension = model.getFileExtension();

    if (extension === 'obj') {
      suggestions.push('Considere converter para GLTF para melhor performance');
    }

    if (extension === 'fbx') {
      suggestions.push('FBX pode ter problemas de compatibilidade, prefira GLTF');
    }

    if (!model.getDescription()) {
      suggestions.push('Adicione uma descrição detalhada ao modelo');
    }

    return suggestions;
  }

  private static getFileExtension(filePath: string): string {
    return '.' + filePath.split('.').pop()?.toLowerCase() || '';
  }
}