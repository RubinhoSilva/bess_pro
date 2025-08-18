import { IClientRepository } from "../../../../domain/repositories/IClientRepository";
import { Client } from "../../../../domain/entities/Client";
import { UserId } from "../../../../domain/value-objects/UserId";
import { ClientModel } from "../schemas/ClientSchema";
import { ClientDbMapper } from "../mappers/ClientDbMapper";
import { Types } from 'mongoose';

export class MongoClientRepository implements IClientRepository {
  
  // Soft delete methods
  async softDelete(id: string): Promise<void> {
    const result = await ClientModel.findOneAndUpdate(
      { $or: [{ domainId: id }, { _id: Types.ObjectId.isValid(id) ? id : null }] },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Cliente não encontrado para exclusão');
    }
  }

  async restore(id: string): Promise<void> {
    const result = await ClientModel.findOneAndUpdate(
      { $or: [{ domainId: id }, { _id: Types.ObjectId.isValid(id) ? id : null }] },
      { 
        isDeleted: false, 
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true }
    );
    if (!result) {
      throw new Error('Cliente não encontrado para restauração');
    }
  }

  async hardDelete(id: string): Promise<void> {
    const result = await ClientModel.findOneAndDelete(
      { $or: [{ domainId: id }, { _id: Types.ObjectId.isValid(id) ? id : null }] }
    );
    if (!result) {
      throw new Error('Cliente não encontrado para exclusão permanente');
    }
  }

  async findByIdIncludingDeleted(id: string): Promise<Client | null> {
    let clientDoc = await ClientModel.findOne({ domainId: id });
    
    if (!clientDoc && Types.ObjectId.isValid(id)) {
      clientDoc = await ClientModel.findById(id);
    }
    
    if (!clientDoc) {
      return null;
    }

    return ClientDbMapper.toDomain(clientDoc);
  }

  async findAllIncludingDeleted(): Promise<Client[]> {
    const docs = await ClientModel.find().sort({ createdAt: -1 });
    return docs.map(doc => ClientDbMapper.toDomain(doc));
  }

  async findDeleted(): Promise<Client[]> {
    const docs = await ClientModel.find({ isDeleted: true }).sort({ deletedAt: -1 });
    return docs.map(doc => ClientDbMapper.toDomain(doc));
  }

  async isDeleted(id: string): Promise<boolean> {
    let doc = await ClientModel.findOne({ domainId: id });
    if (!doc && Types.ObjectId.isValid(id)) {
      doc = await ClientModel.findById(id);
    }
    return doc?.isDeleted || false;
  }

  async exists(id: string): Promise<boolean> {
    const count = await ClientModel.countDocuments({
      $or: [{ domainId: id }, { _id: Types.ObjectId.isValid(id) ? id : null }],
      $and: [{ $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] }]
    });
    return count > 0;
  }

  async save(client: Client): Promise<Client> {
    const clientData = ClientDbMapper.toPersistence(client);
    
    const savedDoc = await ClientModel.findOneAndUpdate(
      { domainId: client.getId() },
      {
        ...clientData,
        updatedAt: new Date()
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    return ClientDbMapper.toDomain(savedDoc);
  }

  async update(client: Client): Promise<Client> {
    const updateData = ClientDbMapper.toPersistence(client);
    const updatedDoc = await ClientModel.findOneAndUpdate(
      { 
        domainId: client.getId(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      },
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Cliente não encontrado para atualização');
    }

    return ClientDbMapper.toDomain(updatedDoc);
  }

  async findById(id: string): Promise<Client | null> {
    let clientDoc = await ClientModel.findOne({ 
      domainId: id, 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    });
    
    if (!clientDoc && Types.ObjectId.isValid(id)) {
      clientDoc = await ClientModel.findOne({ 
        _id: id, 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      });
    }
    
    if (!clientDoc) {
      return null;
    }

    return ClientDbMapper.toDomain(clientDoc);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async findByUserId(
    userId: UserId, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{
    clients: Client[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    const [clientDocs, total] = await Promise.all([
      ClientModel.find({ 
        userId: userId.getValue(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      ClientModel.countDocuments({ 
        userId: userId.getValue(), 
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
      })
    ]);

    const clients = clientDocs.map(doc => ClientDbMapper.toDomain(doc));
    const totalPages = Math.ceil(total / pageSize);

    return {
      clients,
      total,
      totalPages
    };
  }

  async create(clientData: any, userId: string): Promise<Client> {
    const domainId = crypto.randomUUID();
    const clientDoc = new ClientModel({
      ...clientData,
      domainId,
      userId,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await clientDoc.save();
    return ClientDbMapper.toDomain(clientDoc);
  }

  async findByEmail(email: string, userId?: string): Promise<Client | null> {
    const query: any = { 
      email: email.toLowerCase(), 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };
    if (userId) {
      query.userId = userId;
    }
    
    const clientDoc = await ClientModel.findOne(query);
    
    if (!clientDoc) {
      return null;
    }

    return ClientDbMapper.toDomain(clientDoc);
  }

  async search(
    userId: UserId, 
    searchTerm: string, 
    page: number = 1, 
    pageSize: number = 10
  ): Promise<{
    clients: Client[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * pageSize;
    
    const searchQuery = {
      userId: userId.getValue(),
      $and: [
        { $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }] },
        { 
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { company: { $regex: searchTerm, $options: 'i' } },
            { phone: { $regex: searchTerm, $options: 'i' } }
          ]
        }
      ]
    };

    const [clientDocs, total] = await Promise.all([
      ClientModel.find(searchQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      ClientModel.countDocuments(searchQuery)
    ]);

    const clients = clientDocs.map(doc => ClientDbMapper.toDomain(doc));
    const totalPages = Math.ceil(total / pageSize);

    return {
      clients,
      total,
      totalPages
    };
  }

  async getAll(userId?: string): Promise<Client[]> {
    const query: any = { 
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }]
    };
    if (userId) {
      query.userId = userId;
    }
    const clientDocs = await ClientModel.find(query).sort({ createdAt: -1 });
    return clientDocs.map(doc => ClientDbMapper.toDomain(doc));
  }
}