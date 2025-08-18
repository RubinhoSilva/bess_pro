const { randomUUID } = require('crypto');
const { MongoClient } = require('mongodb');

async function fixClientDomainIds() {
  const client = new MongoClient('mongodb://admin:bess123456@localhost:27017/bess_pro?authSource=admin');
  
  try {
    await client.connect();
    const db = client.db('bess_pro');
    const clientsCollection = db.collection('clients');
    
    // Buscar clientes sem domainId
    const clientsWithoutDomainId = await clientsCollection.find({ domainId: { $exists: false } }).toArray();
    
    console.log(`Encontrados ${clientsWithoutDomainId.length} clientes sem domainId`);
    
    // Atualizar cada cliente
    for (const clientDoc of clientsWithoutDomainId) {
      const domainId = randomUUID();
      await clientsCollection.updateOne(
        { _id: clientDoc._id },
        { $set: { domainId } }
      );
      console.log(`Cliente ${clientDoc.name} atualizado com domainId: ${domainId}`);
    }
    
    console.log('Migração concluída!');
  } finally {
    await client.close();
  }
}

fixClientDomainIds().catch(console.error);