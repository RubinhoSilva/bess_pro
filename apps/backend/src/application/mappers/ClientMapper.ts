import { Client, ClientStatus, ClientType } from "../../domain/entities/Client";
import { CreateClientCommand } from "../dtos/input/client/CreateClientCommand";
import { UpdateClientCommand } from "../dtos/input/client/UpdateClientCommand";
import { ClientResponseDto } from "../dtos/output/ClientResponseDto";

export class ClientMapper {
  static toResponseDto(client: Client): ClientResponseDto {
    return {
      id: client.getId(),
      name: client.getName().getValue(),
      email: client.getEmail().getValue(),
      phone: client.getPhone(),
      company: client.getCompany(),
      document: client.getDocument(),
      address: client.getAddress(),
      city: client.getCity(),
      state: client.getState(),
      zipCode: client.getZipCode(),
      status: client.getStatus(),
      clientType: client.getClientType(),
      notes: client.getNotes(),
      tags: client.getTags(),
      totalProjectsValue: client.getTotalProjectsValue(),
      lastContactDate: client.getLastContactDate()?.toISOString(),
      nextFollowUpDate: client.getNextFollowUpDate()?.toISOString(),
      createdAt: client.getCreatedAt().toISOString(),
      updatedAt: client.getUpdatedAt().toISOString()
    };
  }

  static createCommandToDomain(command: CreateClientCommand, userId: string): Client {
    return Client.create({
      name: command.name,
      email: command.email,
      phone: command.phone,
      company: command.company,
      document: command.document,
      address: command.address,
      city: command.city,
      state: command.state,
      zipCode: command.zipCode,
      status: command.status as ClientStatus,
      clientType: command.clientType as ClientType,
      notes: command.notes,
      tags: command.tags,
      totalProjectsValue: command.totalProjectsValue,
      lastContactDate: command.lastContactDate ? new Date(command.lastContactDate) : undefined,
      nextFollowUpDate: command.nextFollowUpDate ? new Date(command.nextFollowUpDate) : undefined,
      userId
    });
  }

  static applyUpdateCommand(client: Client, command: UpdateClientCommand): void {
    if (command.name !== undefined) {
      client.updateName(command.name);
    }
    if (command.email !== undefined) {
      client.updateEmail(command.email);
    }
    if (command.phone !== undefined) {
      client.updatePhone(command.phone);
    }
    if (command.company !== undefined) {
      client.updateCompany(command.company);
    }
    if (command.document !== undefined) {
      client.updateDocument(command.document);
    }
    if (command.address !== undefined) {
      client.updateAddress(command.address);
    }
    if (command.city !== undefined) {
      client.updateCity(command.city);
    }
    if (command.state !== undefined) {
      client.updateState(command.state);
    }
    if (command.zipCode !== undefined) {
      client.updateZipCode(command.zipCode);
    }
    if (command.status !== undefined) {
      client.updateStatus(command.status as ClientStatus);
    }
    if (command.clientType !== undefined) {
      client.updateClientType(command.clientType as ClientType);
    }
    if (command.notes !== undefined) {
      client.updateNotes(command.notes);
    }
    if (command.tags !== undefined) {
      client.updateTags(command.tags);
    }
    if (command.totalProjectsValue !== undefined) {
      client.updateTotalProjectsValue(command.totalProjectsValue);
    }
    if (command.lastContactDate !== undefined) {
      client.updateLastContactDate(command.lastContactDate ? new Date(command.lastContactDate) : null);
    }
    if (command.nextFollowUpDate !== undefined) {
      client.updateNextFollowUpDate(command.nextFollowUpDate ? new Date(command.nextFollowUpDate) : null);
    }
  }
}