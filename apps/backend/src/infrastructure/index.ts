import { AppConfig } from "./config/AppConfig";
import { Container } from "./di/Container";
import { MemoryCache } from "./cache/MemoryCache";
import { RedisCache } from "./cache/RedisCache";
import { loadConfig } from "./config/AppConfig";
import { DatabaseConnection } from "./database/connection";
import { runMigrations } from "./database/migrations";
import { MongoProjectRepository } from "./database/mongodb/repositories/MongoProjectRepository";
import { MongoUserRepository } from "./database/mongodb/repositories/MongoUserRepository";
import { AreaMontagemModel } from "./database/mongodb/schemas/AreaMontagemSchema";
import { GoogleApiKeyModel } from "./database/mongodb/schemas/GoogleApiKeySchema";
import { LeadModel } from "./database/mongodb/schemas/LeadSchema";
import { Model3DModel } from "./database/mongodb/schemas/Model3DSchema";
import { ProjectModel } from "./database/mongodb/schemas/ProjectSchema";
import { UserModel } from "./database/mongodb/schemas/UserSchema";
import { ServiceTokens } from "./di/ServiceTokens";
import { NodemailerEmailService } from "./email/NodemailerEmailService";
import { SendGridEmailService } from "./email/SendGridEmailService";
import { PaymentGatewayService } from "./external-apis/PaymentGatewayService";
import { PvgisApiService } from "./external-apis/PvgisApiService";
import { BcryptPasswordHashService } from "./security/BcryptPasswordHashService";
import { JwtTokenService } from "./security/JwtTokenService";
import { LocalFileStorageService } from "./storage/LocalFileStorageService";
import { S3FileStorageService } from "./storage/S3FileStorageService";
import { SocketIOServer } from "./websockets/SocketIOServer";

export {
  // Database
  DatabaseConnection,
  
  // MongoDB
  UserModel,
  ProjectModel,
  LeadModel,
  Model3DModel,
  AreaMontagemModel,
  GoogleApiKeyModel,
  
  // Repositories
  MongoUserRepository,
  MongoProjectRepository,
  
  // Services
  BcryptPasswordHashService,
  JwtTokenService,
  NodemailerEmailService,
  SendGridEmailService,
  S3FileStorageService,
  LocalFileStorageService,
  
  // External APIs
  GoogleSolarApiService,
  PvgisApiService,
  PaymentGatewayService,
  
  // Cache
  RedisCache,
  MemoryCache,
  
  // WebSockets
  SocketIOServer,
  
  // DI Container
  Container,
  ServiceTokens,
  
  // Configuration
  loadConfig,
  
  // Migrations
  runMigrations,
};

export type {
  AppConfig,
};