// MongoDB initialization script
print('Starting MongoDB initialization...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create application user
db.createUser({
  user: 'bess-pro-user',
  pwd: 'bess123456',
  roles: [
    {
      role: 'dbOwner',
      db: 'bess-pro'
    }
  ]
});

// Switch to application database
db = db.getSiblingDB('bess-pro');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        name: {
          bsonType: 'string',
          minLength: 2
        },
        role: {
          bsonType: 'string',
          enum: ['super_admin', 'team_owner', 'admin', 'vendedor', 'viewer']
        }
      }
    }
  }
});

db.createCollection('leads', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'stage', 'userId'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        stage: {
          bsonType: 'string',
          enum: [
            'lead-recebido',
            'pre-qualificacao', 
            'proposta-enviada',
            'documentacao-recebida',
            'projeto-aprovado',
            'instalacao-agendada',
            'sistema-entregue'
          ]
        }
      }
    }
  }
});

db.createCollection('projects');
db.createCollection('calculations');
db.createCollection('payments');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.leads.createIndex({ userId: 1 });
db.leads.createIndex({ email: 1 });
db.leads.createIndex({ stage: 1 });
db.projects.createIndex({ userId: 1 });
db.projects.createIndex({ leadId: 1 });

// Insert sample data for development
db.users.insertOne({
  _id: new ObjectId(),
  email: 'admin@gmail.com',
  name: 'Super Admin',
  company: 'BESS Pro',
  role: 'super_admin',
  passwordHash: '$2b$12$VFJvKGqw6x.1ixz6Z6FzEuDZQJh6dXKz3JjEqVxKkGOQbF4xzKcHO',
  status: 'active',
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed!');
