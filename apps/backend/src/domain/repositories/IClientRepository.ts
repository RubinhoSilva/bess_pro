import { Client, ClientStatus } from "../entities/Client";
import { UserId } from "../value-objects/UserId";
import { ISoftDeleteRepository } from "./IBaseRepository";

export interface IClientRepository extends ISoftDeleteRepository<Client, string> {
  create(clientData: any, userId: string): Promise<Client>;
  findById(id: string): Promise<Client | null>;
  findByUserId(userId: UserId, page?: number, pageSize?: number): Promise<{
    clients: Client[];
    total: number;
    totalPages: number;
  }>;
  findByEmail(email: string, userId?: string): Promise<Client | null>;
  update(client: Client): Promise<Client>;
  updateStatus(id: string, status: ClientStatus): Promise<void>;
  delete(id: string): Promise<void>;
  search(userId: UserId, searchTerm: string, page?: number, pageSize?: number): Promise<{
    clients: Client[];
    total: number;
    totalPages: number;
  }>;
  getAll(userId?: string): Promise<Client[]>;
}