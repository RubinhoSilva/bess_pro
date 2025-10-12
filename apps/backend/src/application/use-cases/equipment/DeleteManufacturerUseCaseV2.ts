import { IUseCase } from "@/application/common/IUseCase";
import { Result } from "@/application/common/Result";
import { IEquipmentCatalogRepository } from "@/domain/repositories/IEquipmentCatalogRepository";

export interface DeleteManufacturerCommand {
  id: string;
  teamId?: string; // Para controle de acesso
}

/**
 * Delete Manufacturer Use Case V2 - Usando Equipment Catalog Aggregate
 * 
 * Esta versão demonstra o uso do agregado para centralizar regras de negócio
 * e garantir consistência transacional.
 * 
 * Comparado com a versão anterior:
 * ❌ Antes: Lógica espalhada entre use case e repositório
 * ✅ Agora: Lógica centralizada no agregado
 */
export class DeleteManufacturerUseCaseV2 implements IUseCase<DeleteManufacturerCommand, Result<boolean>> {
  constructor(
    private equipmentCatalogRepository: IEquipmentCatalogRepository
  ) {}

  async execute(command: DeleteManufacturerCommand): Promise<Result<boolean>> {
    try {
      // Carregar o catálogo (agregado) com contexto do time
      const catalog = await this.equipmentCatalogRepository.loadCatalog(command.teamId);
      
      // Buscar fabricante no agregado
      const manufacturer = catalog.getManufacturer(command.id);
      if (!manufacturer) {
        return Result.failure('Fabricante não encontrado');
      }

      // Verificar acesso ao fabricante
      if (!manufacturer.isAccessibleByTeam(command.teamId)) {
        return Result.failure('Acesso negado ao fabricante');
      }

      // === DELEGAÇÃO PARA O AGREGADO ===
      // Todas as validações de negócio estão centralizadas no agregado:
      // - Não pode deletar fabricantes padrão
      // - Não pode deletar com equipamentos associados
      // - Mantém consistência dos dados
      const deleteResult = catalog.deleteManufacturer(command.id);
      
      if (!deleteResult.isSuccess) {
        return Result.failure(deleteResult.error!);
      }

      // Salvar estado consistente do agregado
      await this.equipmentCatalogRepository.saveCatalog(catalog);

      return Result.success(true);
    } catch (error: any) {
      return Result.failure(`Erro ao remover fabricante: ${error.message}`);
    }
  }
}