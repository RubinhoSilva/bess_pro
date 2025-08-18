export interface IBaseRepository<T, ID> {
  save(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  findById(id: ID): Promise<T | null>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

export interface ISoftDeleteRepository<T, ID> extends IBaseRepository<T, ID> {
  // Soft delete operations
  softDelete(id: ID): Promise<void>;
  restore(id: ID): Promise<void>;
  
  // Find operations that respect soft delete
  findByIdIncludingDeleted(id: ID): Promise<T | null>;
  findAllIncludingDeleted(): Promise<T[]>;
  findDeleted(): Promise<T[]>;
  
  // Hard delete (permanent deletion)
  hardDelete(id: ID): Promise<void>;
  
  // Check if entity is soft deleted
  isDeleted(id: ID): Promise<boolean>;
}