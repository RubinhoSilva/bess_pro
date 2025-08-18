import { Client, ClientProps } from "../../../../domain/entities/Client";
import { IClientDocument } from "../schemas/ClientSchema";

export class ClientDbMapper {
  static toDomain(clientDoc: IClientDocument): Client {
    const props: ClientProps = {
      id: clientDoc.domainId || clientDoc._id?.toString() || crypto.randomUUID(),
      name: clientDoc.name,
      email: clientDoc.email,
      phone: clientDoc.phone,
      company: clientDoc.company,
      document: clientDoc.document,
      address: clientDoc.address,
      city: clientDoc.city,
      state: clientDoc.state,
      zipCode: clientDoc.zipCode,
      status: clientDoc.status,
      clientType: clientDoc.clientType,
      notes: clientDoc.notes,
      tags: clientDoc.tags,
      totalProjectsValue: clientDoc.totalProjectsValue,
      lastContactDate: clientDoc.lastContactDate || undefined,
      nextFollowUpDate: clientDoc.nextFollowUpDate || undefined,
      userId: clientDoc.userId,
      isDeleted: clientDoc.isDeleted,
      deletedAt: clientDoc.deletedAt,
      createdAt: clientDoc.createdAt,
      updatedAt: clientDoc.updatedAt
    };

    return Client.create(props);
  }

  static toPersistence(client: Client): Omit<IClientDocument, '_id'> {
    return {
      domainId: client.getId(),
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
      lastContactDate: client.getLastContactDate() || undefined,
      nextFollowUpDate: client.getNextFollowUpDate() || undefined,
      userId: client.getUserId().getValue(),
      isDeleted: client.isDeleted(),
      deletedAt: client.getDeletedAt() || undefined,
      createdAt: client.getCreatedAt(),
      updatedAt: client.getUpdatedAt()
    };
  }
}