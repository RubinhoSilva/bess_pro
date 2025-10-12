import { EquipmentCatalog } from '../aggregates/EquipmentCatalog';
import { Manufacturer, ManufacturerType } from '../entities/Manufacturer';
import { SolarModule } from '../entities/SolarModule';
import { Inverter } from '../entities/Inverter';

/**
 * Equipment Catalog Repository Interface
 * 
 * Este repositório gerencia a persistência do agregado EquipmentCatalog,
 * garantindo consistência transacional entre todas as entidades do agregado.
 * 
 * Diferente dos repositórios de entidade individuais, este repositório
 * opera no nível do agregado, mantendo os invariants e boundaries.
 */
export interface IEquipmentCatalogRepository {
  // === Aggregate Operations ===

  /**
   * Carrega o catálogo completo de equipamentos
   * @param teamId - ID do time para filtrar equipamentos acessíveis
   * @returns EquipmentCatalog com todos os equipamentos acessíveis
   */
  loadCatalog(teamId?: string): Promise<EquipmentCatalog>;

  /**
   * Salva o estado completo do catálogo
   * @param catalog - Catálogo a ser salvo
   * @returns Promise<void>
   */
  saveCatalog(catalog: EquipmentCatalog): Promise<void>;

  /**
   * Carrega catálogo filtrado por fabricante específico
   * @param manufacturerId - ID do fabricante
   * @returns EquipmentCatalog com dados do fabricante e seus equipamentos
   */
  loadCatalogByManufacturer(manufacturerId: string): Promise<EquipmentCatalog>;

  // === Manufacturer Operations (via Aggregate) ===

  /**
   * Adiciona um fabricante ao catálogo
   * @param manufacturer - Fabricante a ser adicionado
   * @returns Promise<void>
   */
  addManufacturer(manufacturer: Manufacturer): Promise<void>;

  /**
   * Atualiza um fabricante no catálogo
   * @param manufacturer - Fabricante a ser atualizado
   * @returns Promise<void>
   */
  updateManufacturer(manufacturer: Manufacturer): Promise<void>;

  /**
   * Remove um fabricante do catálogo (com validação de equipamentos)
   * @param manufacturerId - ID do fabricante a ser removido
   * @returns true se removido com sucesso, false caso contrário
   */
  deleteManufacturer(manufacturerId: string): Promise<boolean>;

  /**
   * Verifica se um fabricante possui equipamentos associados
   * @param manufacturerId - ID do fabricante
   * @returns true se possui equipamentos, false caso contrário
   */
  hasEquipment(manufacturerId: string): Promise<boolean>;

  // === Module Operations (via Aggregate) ===

  /**
   * Adiciona um módulo ao catálogo
   * @param module - Módulo a ser adicionado
   * @returns Promise<void>
   */
  addModule(module: SolarModule): Promise<void>;

  /**
   * Atualiza um módulo no catálogo
   * @param module - Módulo a ser atualizado
   * @returns Promise<void>
   */
  updateModule(module: SolarModule): Promise<void>;

  /**
   * Remove um módulo do catálogo
   * @param moduleId - ID do módulo a ser removido
   * @returns true se removido com sucesso, false caso contrário
   */
  deleteModule(moduleId: string): Promise<boolean>;

  // === Inverter Operations (via Aggregate) ===

  /**
   * Adiciona um inversor ao catálogo
   * @param inverter - Inversor a ser adicionado
   * @returns Promise<void>
   */
  addInverter(inverter: Inverter): Promise<void>;

  /**
   * Atualiza um inversor no catálogo
   * @param inverter - Inversor a ser atualizado
   * @returns Promise<void>
   */
  updateInverter(inverter: Inverter): Promise<void>;

  /**
   * Remove um inversor do catálogo
   * @param inverterId - ID do inversor a ser removido
   * @returns true se removido com sucesso, false caso contrário
   */
  deleteInverter(inverterId: string): Promise<boolean>;

  // === Query Operations (Read-Only) ===

  /**
   * Busca fabricante por ID
   * @param id - ID do fabricante
   * @returns Fabricante encontrado ou null
   */
  findManufacturerById(id: string): Promise<Manufacturer | null>;

  /**
   * Busca fabricante por nome
   * @param name - Nome do fabricante
   * @param teamId - ID do time para controle de acesso
   * @returns Fabricante encontrado ou null
   */
  findManufacturerByName(name: string, teamId?: string): Promise<Manufacturer | null>;

  /**
   * Lista fabricantes por tipo
   * @param type - Tipo do fabricante
   * @param teamId - ID do time para controle de acesso
   * @returns Lista de fabricantes do tipo especificado
   */
  findManufacturersByType(type: ManufacturerType, teamId?: string): Promise<Manufacturer[]>;

  /**
   * Lista fabricantes acessíveis por um time
   * @param teamId - ID do time
   * @returns Lista de fabricantes acessíveis
   */
  findAccessibleManufacturers(teamId?: string): Promise<Manufacturer[]>;

  /**
   * Lista fabricantes padrão do sistema
   * @returns Lista de fabricantes padrão
   */
  findDefaultManufacturers(): Promise<Manufacturer[]>;

  /**
   * Busca módulo por ID
   * @param id - ID do módulo
   * @returns Módulo encontrado ou null
   */
  findModuleById(id: string): Promise<SolarModule | null>;

  /**
   * Busca módulos por fabricante
   * @param manufacturerId - ID do fabricante
   * @param userId - ID do usuário para controle de acesso
   * @returns Lista de módulos do fabricante
   */
  findModulesByManufacturer(manufacturerId: string, userId: string): Promise<SolarModule[]>;

  /**
   * Busca inversor por ID
   * @param id - ID do inversor
   * @returns Inversor encontrado ou null
   */
  findInverterById(id: string): Promise<Inverter | null>;

  /**
   * Busca inversores por fabricante
   * @param manufacturerId - ID do fabricante
   * @param userId - ID do usuário para controle de acesso
   * @returns Lista de inversores do fabricante
   */
  findInvertersByManufacturer(manufacturerId: string, userId: string): Promise<Inverter[]>;

  // === Consistency Validation ===

  /**
   * Valida consistência dos dados no repositório
   * @returns true se consistente, false caso contrário
   */
  validateConsistency(): Promise<boolean>;

  /**
   * Repara inconsistências nos dados
   * @returns Número de inconsistências reparadas
   */
  repairInconsistencies(): Promise<number>;
}