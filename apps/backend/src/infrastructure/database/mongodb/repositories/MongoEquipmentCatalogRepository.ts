import { IEquipmentCatalogRepository } from '../../../../domain/repositories/IEquipmentCatalogRepository';
import { EquipmentCatalog } from '../../../../domain/aggregates/EquipmentCatalog';
import { Manufacturer, ManufacturerType } from '../../../../domain/entities/Manufacturer';
import { SolarModule } from '../../../../domain/entities/SolarModule';
import { Inverter } from '../../../../domain/entities/Inverter';
import { MongoManufacturerRepository } from './MongoManufacturerRepository';
import { MongoSolarModuleRepository } from './MongoSolarModuleRepository';
import { MongoInverterRepository } from './MongoInverterRepository';

/**
 * Mongo Equipment Catalog Repository
 * 
 * Implementação do repositório de agregado que coordena os repositórios
 * individuais para garantir consistência transacional do Equipment Catalog.
 * 
 * Esta implementação usa uma abordagem de composição, combinando os
 * repositórios existentes para operações no nível do agregado.
 */
export class MongoEquipmentCatalogRepository implements IEquipmentCatalogRepository {
  
  constructor(
    private manufacturerRepository: MongoManufacturerRepository,
    private moduleRepository: MongoSolarModuleRepository,
    private inverterRepository: MongoInverterRepository
  ) {}

  // === Aggregate Operations ===

  async loadCatalog(teamId?: string): Promise<EquipmentCatalog> {
    try {
      // Carregar todos os dados em paralelo para performance
      const [manufacturers, modules, inverters] = await Promise.all([
        this.loadAccessibleManufacturers(teamId),
        this.loadAccessibleModules(teamId),
        this.loadAccessibleInverters(teamId)
      ]);

      // Criar e retornar o agregado
      return EquipmentCatalog.fromExisting(manufacturers, modules, inverters);
    } catch (error) {
      console.error('Error loading equipment catalog:', error);
      throw new Error(`Failed to load equipment catalog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveCatalog(catalog: EquipmentCatalog): Promise<void> {
    try {
      // Em uma implementação real, isso seria uma transação
      // Por ora, salvamos individualmente (não atômico, mas funcional)
      const catalogData = catalog.toJSON();
      
      // Salvar todos os dados
      await Promise.all([
        this.saveManufacturers(catalogData.manufacturers),
        this.saveModules(catalogData.modules),
        this.saveInverters(catalogData.inverters)
      ]);
    } catch (error) {
      console.error('Error saving equipment catalog:', error);
      throw new Error(`Failed to save equipment catalog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadCatalogByManufacturer(manufacturerId: string): Promise<EquipmentCatalog> {
    try {
      // Carregar fabricante específico
      const manufacturer = await this.manufacturerRepository.findById(manufacturerId);
      if (!manufacturer) {
        throw new Error(`Manufacturer ${manufacturerId} not found`);
      }

      // Carregar equipamentos do fabricante
      const [modules, inverters] = await Promise.all([
        this.findModulesByManufacturer(manufacturerId, 'system'), // System user para acesso total
        this.findInvertersByManufacturer(manufacturerId, 'system')
      ]);

      return EquipmentCatalog.fromExisting([manufacturer], modules, inverters);
    } catch (error) {
      console.error('Error loading catalog by manufacturer:', error);
      throw new Error(`Failed to load catalog for manufacturer ${manufacturerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // === Manufacturer Operations ===

  async addManufacturer(manufacturer: Manufacturer): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.addManufacturer(manufacturer);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.manufacturerRepository.create(manufacturer);
    } catch (error) {
      console.error('Error adding manufacturer:', error);
      throw error;
    }
  }

  async updateManufacturer(manufacturer: Manufacturer): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.updateManufacturer(manufacturer);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.manufacturerRepository.update(manufacturer.id!, manufacturer);
    } catch (error) {
      console.error('Error updating manufacturer:', error);
      throw error;
    }
  }

  async deleteManufacturer(manufacturerId: string): Promise<boolean> {
    try {
      // Validar no agregado antes de deletar
      const catalog = await this.loadCatalog();
      const result = catalog.deleteManufacturer(manufacturerId);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      return await this.manufacturerRepository.delete(manufacturerId);
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      throw error;
    }
  }

  async hasEquipment(manufacturerId: string): Promise<boolean> {
    try {
      return await this.manufacturerRepository.hasEquipment(manufacturerId);
    } catch (error) {
      console.error('Error checking manufacturer equipment:', error);
      return false;
    }
  }

  // === Module Operations ===

  async addModule(module: SolarModule): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.addModule(module);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.moduleRepository.create(module.toJSON());
    } catch (error) {
      console.error('Error adding module:', error);
      throw error;
    }
  }

  async updateModule(module: SolarModule): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.updateModule(module);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.moduleRepository.update(module.id!, module.toJSON());
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  async deleteModule(moduleId: string): Promise<boolean> {
    try {
      // Validar no agregado antes de deletar
      const catalog = await this.loadCatalog();
      const result = catalog.deleteModule(moduleId);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      return await this.moduleRepository.delete(moduleId);
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  // === Inverter Operations ===

  async addInverter(inverter: Inverter): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.addInverter(inverter);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.inverterRepository.create(inverter.toJSON());
    } catch (error) {
      console.error('Error adding inverter:', error);
      throw error;
    }
  }

  async updateInverter(inverter: Inverter): Promise<void> {
    try {
      // Validar no agregado antes de persistir
      const catalog = await this.loadCatalog();
      const result = catalog.updateInverter(inverter);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      await this.inverterRepository.update(inverter.id!, inverter.toJSON());
    } catch (error) {
      console.error('Error updating inverter:', error);
      throw error;
    }
  }

  async deleteInverter(inverterId: string): Promise<boolean> {
    try {
      // Validar no agregado antes de deletar
      const catalog = await this.loadCatalog();
      const result = catalog.deleteInverter(inverterId);
      
      if (!result.isSuccess) {
        throw new Error(result.error!);
      }

      // Persistir usando repositório existente
      return await this.inverterRepository.delete(inverterId);
    } catch (error) {
      console.error('Error deleting inverter:', error);
      throw error;
    }
  }

  // === Query Operations ===

  async findManufacturerById(id: string): Promise<Manufacturer | null> {
    return await this.manufacturerRepository.findById(id);
  }

  async findManufacturerByName(name: string, teamId?: string): Promise<Manufacturer | null> {
    return await this.manufacturerRepository.findByName(name, teamId);
  }

  async findManufacturersByType(type: ManufacturerType, teamId?: string): Promise<Manufacturer[]> {
    return await this.manufacturerRepository.findByType(type, teamId);
  }

  async findAccessibleManufacturers(teamId?: string): Promise<Manufacturer[]> {
    return await this.manufacturerRepository.findAccessibleByTeam(teamId);
  }

  async findDefaultManufacturers(): Promise<Manufacturer[]> {
    return await this.manufacturerRepository.findDefaults();
  }

  async findModuleById(id: string): Promise<SolarModule | null> {
    return await this.moduleRepository.findById(id);
  }

  async findModulesByManufacturer(manufacturerId: string, userId: string): Promise<SolarModule[]> {
    const result = await this.moduleRepository.findByUserId(userId, {
      fabricante: undefined // Buscar todos do fabricante específico
    });
    
    // Filtrar por manufacturerId
    return result.modules.filter((m: any) => m.manufacturerId === manufacturerId);
  }

  async findInverterById(id: string): Promise<Inverter | null> {
    return await this.inverterRepository.findById(id);
  }

  async findInvertersByManufacturer(manufacturerId: string, userId: string): Promise<Inverter[]> {
    const result = await this.inverterRepository.findByUserId(userId, {
      fabricante: undefined // Buscar todos do fabricante específico
    });
    
    // Filtrar por manufacturerId
    return result.inverters.filter((i: any) => i.manufacturerId === manufacturerId);
  }

  // === Consistency Validation ===

  async validateConsistency(): Promise<boolean> {
    try {
      const catalog = await this.loadCatalog();
      const result = catalog.validateConsistency();
      return result.isSuccess;
    } catch (error) {
      console.error('Error validating consistency:', error);
      return false;
    }
  }

  async repairInconsistencies(): Promise<number> {
    try {
      // Implementação básica - em um sistema real seria mais complexo
      const catalog = await this.loadCatalog();
      const validation = catalog.validateConsistency();
      
      if (validation.isSuccess) {
        return 0; // Nenhuma inconsistência encontrada
      }

      // Salvar estado consistente (se possível)
      await this.saveCatalog(catalog);
      
      // Por ora, retornamos 1 como indicador que tentamos reparar
      return 1;
    } catch (error) {
      console.error('Error repairing inconsistencies:', error);
      return 0;
    }
  }

  // === Private Helper Methods ===

  private async loadAccessibleManufacturers(teamId?: string): Promise<Manufacturer[]> {
    return await this.manufacturerRepository.findAccessibleByTeam(teamId);
  }

  private async loadAccessibleModules(userId?: string): Promise<SolarModule[]> {
    if (!userId) {
      return [];
    }
    
    const result = await this.moduleRepository.findByUserId(userId);
    return result.modules;
  }

  private async loadAccessibleInverters(userId?: string): Promise<Inverter[]> {
    if (!userId) {
      return [];
    }
    
    const result = await this.inverterRepository.findByUserId(userId);
    return result.inverters;
  }

  private async saveManufacturers(manufacturers: Manufacturer[]): Promise<void> {
    // Implementação simplificada - em produção seria transacional
    for (const manufacturer of manufacturers) {
      const existing = await this.manufacturerRepository.findById(manufacturer.id!);
      if (existing) {
        await this.manufacturerRepository.update(manufacturer.id!, manufacturer);
      } else {
        await this.manufacturerRepository.create(manufacturer);
      }
    }
  }

  private async saveModules(modules: SolarModule[]): Promise<void> {
    // Implementação simplificada - em produção seria transacional
    for (const module of modules) {
      const existing = await this.moduleRepository.findById(module.id!);
      if (existing) {
        await this.moduleRepository.update(module.id!, module.toJSON());
      } else {
        await this.moduleRepository.create(module.toJSON());
      }
    }
  }

  private async saveInverters(inverters: Inverter[]): Promise<void> {
    // Implementação simplificada - em produção seria transacional
    for (const inverter of inverters) {
      const existing = await this.inverterRepository.findById(inverter.id!);
      if (existing) {
        await this.inverterRepository.update(inverter.id!, inverter.toJSON());
      } else {
        await this.inverterRepository.create(inverter.toJSON());
      }
    }
  }
}