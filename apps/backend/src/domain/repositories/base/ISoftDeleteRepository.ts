export interface ISoftDeleteRepository<T> {
  create(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, updateData: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  hardDelete(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
  exists(id: string): Promise<boolean>;
}