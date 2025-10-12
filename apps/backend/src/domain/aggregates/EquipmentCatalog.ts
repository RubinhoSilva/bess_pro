import { Manufacturer, ManufacturerType } from '../entities/Manufacturer';
import { SolarModule } from '../entities/SolarModule';
import { Inverter } from '../entities/Inverter';
import { Result } from '../../application/common/Result';

/**
 * Equipment Catalog Aggregate
 * 
 * Este agregado gerencia a consistência entre fabricantes e seus equipamentos,
 * garantindo invariants e regras de negócio centralizadas.
 * 
 * Boundary: Manufacturer + SolarModule + Inverter
 * Root Entity: Manufacturer
 */
export class EquipmentCatalog {
  private manufacturers: Map<string, Manufacturer>;
  private modules: Map<string, SolarModule>;
  private inverters: Map<string, Inverter>;

  constructor() {
    this.manufacturers = new Map();
    this.modules = new Map();
    this.inverters = new Map();
  }

  // === Factory Methods ===

  public static create(): EquipmentCatalog {
    return new EquipmentCatalog();
  }

  public static fromExisting(
    manufacturers: Manufacturer[],
    modules: SolarModule[],
    inverters: Inverter[]
  ): EquipmentCatalog {
    const catalog = new EquipmentCatalog();
    
    manufacturers.forEach(m => catalog.manufacturers.set(m.id!, m));
    modules.forEach(m => catalog.modules.set(m.id!, m));
    inverters.forEach(i => catalog.inverters.set(i.id!, i));
    
    return catalog;
  }

  // === Manufacturer Operations ===

  public addManufacturer(manufacturer: Manufacturer): Result<void> {
    // Validar invariants
    if (this.manufacturers.has(manufacturer.id!)) {
      return Result.failure('Manufacturer already exists in catalog');
    }

    // Validar nome único
    const existingByName = Array.from(this.manufacturers.values())
      .find(m => m.name.toLowerCase() === manufacturer.name.toLowerCase());
    
    if (existingByName) {
      return Result.failure('Manufacturer with this name already exists');
    }

    this.manufacturers.set(manufacturer.id!, manufacturer);
    return Result.success(undefined);
  }

  public updateManufacturer(manufacturer: Manufacturer): Result<void> {
    if (!this.manufacturers.has(manufacturer.id!)) {
      return Result.failure('Manufacturer not found in catalog');
    }

    // Validar nome único (exceto para o mesmo fabricante)
    const existingByName = Array.from(this.manufacturers.values())
      .find(m => 
        m.name.toLowerCase() === manufacturer.name.toLowerCase() && 
        m.id !== manufacturer.id
      );
    
    if (existingByName) {
      return Result.failure('Manufacturer with this name already exists');
    }

    this.manufacturers.set(manufacturer.id!, manufacturer);
    return Result.success(undefined);
  }

  public deleteManufacturer(manufacturerId: string): Result<void> {
    const manufacturer = this.manufacturers.get(manufacturerId);
    
    if (!manufacturer) {
      return Result.failure('Manufacturer not found');
    }

    // === INVARIANT: Não pode deletar fabricante com equipamentos ===
    if (this.hasEquipment(manufacturerId)) {
      return Result.failure(
        'Cannot delete manufacturer with associated equipment. ' +
        'Delete or reassign all modules and inverters first.'
      );
    }

    // === INVARIANT: Não pode deletar fabricantes padrão ===
    if (manufacturer.isDefault) {
      return Result.failure('Cannot delete default manufacturers');
    }

    this.manufacturers.delete(manufacturerId);
    return Result.success(undefined);
  }

  // === Module Operations ===

  public addModule(module: SolarModule): Result<void> {
    // Validar manufacturer existe e pode produzir módulos
    if (!module.manufacturerId) {
      return Result.failure('ID do fabricante é obrigatório');
    }
    
    const manufacturerResult = this.validateManufacturerForEquipment(
      module.manufacturerId, 
      'SOLAR_MODULE'
    );
    
    if (!manufacturerResult.isSuccess) {
      return Result.failure(manufacturerResult.error!);
    }

    // Validar modelo único por fabricante
    const existingByModel = Array.from(this.modules.values())
      .find(m => 
        m.manufacturerId === module.manufacturerId &&
        m.modelo.toLowerCase() === module.modelo.toLowerCase()
      );
    
    if (existingByModel) {
      return Result.failure('Module model already exists for this manufacturer');
    }

    this.modules.set(module.id!, module);
    return Result.success(undefined);
  }

  public updateModule(module: SolarModule): Result<void> {
    if (!this.modules.has(module.id!)) {
      return Result.failure('Module not found');
    }

    // Validar manufacturer existe e pode produzir módulos
    if (!module.manufacturerId) {
      return Result.failure('ID do fabricante é obrigatório');
    }
    
    const manufacturerResult = this.validateManufacturerForEquipment(
      module.manufacturerId, 
      'SOLAR_MODULE'
    );
    
    if (!manufacturerResult.isSuccess) {
      return Result.failure(manufacturerResult.error!);
    }

    // Validar modelo único por fabricante (exceto para o mesmo módulo)
    const existingByModel = Array.from(this.modules.values())
      .find(m => 
        m.manufacturerId === module.manufacturerId &&
        m.modelo.toLowerCase() === module.modelo.toLowerCase() &&
        m.id !== module.id
      );
    
    if (existingByModel) {
      return Result.failure('Module model already exists for this manufacturer');
    }

    this.modules.set(module.id!, module);
    return Result.success(undefined);
  }

  public deleteModule(moduleId: string): Result<void> {
    if (!this.modules.has(moduleId)) {
      return Result.failure('Module not found');
    }

    this.modules.delete(moduleId);
    return Result.success(undefined);
  }

  // === Inverter Operations ===

  public addInverter(inverter: Inverter): Result<void> {
    // Validar manufacturer existe e pode produzir inversores
    if (!inverter.manufacturerId) {
      return Result.failure('ID do fabricante é obrigatório');
    }
    
    const manufacturerResult = this.validateManufacturerForEquipment(
      inverter.manufacturerId, 
      'INVERTER'
    );
    
    if (!manufacturerResult.isSuccess) {
      return Result.failure(manufacturerResult.error!);
    }

    // Validar modelo único por fabricante
    const existingByModel = Array.from(this.inverters.values())
      .find(i => 
        i.manufacturerId === inverter.manufacturerId &&
        i.modelo.toLowerCase() === inverter.modelo.toLowerCase()
      );
    
    if (existingByModel) {
      return Result.failure('Inverter model already exists for this manufacturer');
    }

    this.inverters.set(inverter.id!, inverter);
    return Result.success(undefined);
  }

  public updateInverter(inverter: Inverter): Result<void> {
    if (!this.inverters.has(inverter.id!)) {
      return Result.failure('Inverter not found');
    }

    // Validar manufacturer existe e pode produzir inversores
    if (!inverter.manufacturerId) {
      return Result.failure('Inverter manufacturer ID is required');
    }
    
    const manufacturerResult = this.validateManufacturerForEquipment(
      inverter.manufacturerId, 
      'INVERTER'
    );
    
    if (!manufacturerResult.isSuccess) {
      return Result.failure(manufacturerResult.error!);
    }

    // Validar modelo único por fabricante (exceto para o mesmo inversor)
    const existingByModel = Array.from(this.inverters.values())
      .find(i => 
        i.manufacturerId === inverter.manufacturerId &&
        i.modelo.toLowerCase() === inverter.modelo.toLowerCase() &&
        i.id !== inverter.id
      );
    
    if (existingByModel) {
      return Result.failure('Inverter model already exists for this manufacturer');
    }

    this.inverters.set(inverter.id!, inverter);
    return Result.success(undefined);
  }

  public deleteInverter(inverterId: string): Result<void> {
    if (!this.inverters.has(inverterId)) {
      return Result.failure('Inverter not found');
    }

    this.inverters.delete(inverterId);
    return Result.success(undefined);
  }

  // === Query Methods ===

  public getManufacturer(id: string): Manufacturer | null {
    return this.manufacturers.get(id) || null;
  }

  public getModule(id: string): SolarModule | null {
    return this.modules.get(id) || null;
  }

  public getInverter(id: string): Inverter | null {
    return this.inverters.get(id) || null;
  }

  public getAllManufacturers(): Manufacturer[] {
    return Array.from(this.manufacturers.values());
  }

  public getAllModules(): SolarModule[] {
    return Array.from(this.modules.values());
  }

  public getAllInverters(): Inverter[] {
    return Array.from(this.inverters.values());
  }

  public getModulesByManufacturer(manufacturerId: string): SolarModule[] {
    return Array.from(this.modules.values())
      .filter(m => m.manufacturerId === manufacturerId);
  }

  public getInvertersByManufacturer(manufacturerId: string): Inverter[] {
    return Array.from(this.inverters.values())
      .filter(i => i.manufacturerId === manufacturerId);
  }

  public getEquipmentCount(manufacturerId: string): { modules: number; inverters: number } {
    const modules = this.getModulesByManufacturer(manufacturerId).length;
    const inverters = this.getInvertersByManufacturer(manufacturerId).length;
    
    return { modules, inverters };
  }

  // === Business Rules Validation ===

  private validateManufacturerForEquipment(
    manufacturerId: string, 
    equipmentType: 'SOLAR_MODULE' | 'INVERTER'
  ): Result<void> {
    const manufacturer = this.manufacturers.get(manufacturerId);
    
    if (!manufacturer) {
      return Result.failure('Manufacturer not found');
    }

    if (!manufacturer.canManufacture(equipmentType)) {
      return Result.failure(
        `Manufacturer ${manufacturer.name} cannot produce ${equipmentType.replace('_', ' ')}s`
      );
    }

    return Result.success(undefined);
  }

  private hasEquipment(manufacturerId: string): boolean {
    const moduleCount = this.getModulesByManufacturer(manufacturerId).length;
    const inverterCount = this.getInvertersByManufacturer(manufacturerId).length;
    
    return moduleCount > 0 || inverterCount > 0;
  }

  // === Consistency Checks ===

  public validateConsistency(): Result<void> {
    const errors: string[] = [];

    // Verificar módulos com fabricantes inexistentes
    for (const module of Array.from(this.modules.values())) {
      if (module.manufacturerId && !this.manufacturers.has(module.manufacturerId)) {
        errors.push(`Module ${module.modelo} references non-existent manufacturer ${module.manufacturerId}`);
      }
    }

    // Verificar inversores com fabricantes inexistentes
    for (const inverter of Array.from(this.inverters.values())) {
      if (inverter.manufacturerId && !this.manufacturers.has(inverter.manufacturerId)) {
        errors.push(`Inverter ${inverter.modelo} references non-existent manufacturer ${inverter.manufacturerId}`);
      }
    }

    // Verificar consistência de tipo de fabricante
    for (const module of Array.from(this.modules.values())) {
      if (module.manufacturerId) {
        const manufacturer = this.manufacturers.get(module.manufacturerId);
        if (manufacturer && !manufacturer.canManufacture('SOLAR_MODULE')) {
          errors.push(`Manufacturer ${manufacturer.name} cannot produce solar modules but has module ${module.modelo}`);
        }
      }
    }

    for (const inverter of Array.from(this.inverters.values())) {
      if (inverter.manufacturerId) {
        const manufacturer = this.manufacturers.get(inverter.manufacturerId);
        if (manufacturer && !manufacturer.canManufacture('INVERTER')) {
          errors.push(`Manufacturer ${manufacturer.name} cannot produce inverters but has inverter ${inverter.modelo}`);
        }
      }
    }

    if (errors.length > 0) {
      return Result.failure(`Consistency violations: ${errors.join('; ')}`);
    }

    return Result.success(undefined);
  }

  // === Serialization ===

  public toJSON(): {
    manufacturers: Manufacturer[];
    modules: SolarModule[];
    inverters: Inverter[];
  } {
    return {
      manufacturers: this.getAllManufacturers(),
      modules: this.getAllModules(),
      inverters: this.getAllInverters()
    };
  }
}