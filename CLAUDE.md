# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Run linting for both applications

### Backend Commands (apps/backend)
- `npm run dev:backend` - Start backend development server with nodemon
- `npm run build:backend` - Build backend TypeScript to JavaScript with tsc-alias for path resolution
- `npm run test:backend` - Run backend tests with Jest
- `npm run test:watch` - Run backend tests in watch mode
- `npm run seed:equipment` - Seed equipment data (solar modules, inverters)

### Frontend Commands (apps/frontend)
- `npm run dev:frontend` - Start frontend development server with Vite
- `npm run build:frontend` - Build frontend for production with TypeScript check
- `npm run test:frontend` - Run frontend tests with Vitest

### Docker Commands
- `npm run docker:up` - Start all services with Docker Compose (development)
- `npm run docker:down` - Stop all Docker services
- `docker-compose -f docker-compose.prod.yml up -d` - Production deployment
- `DOCKER_DEFAULT_PLATFORM=linux/arm64 docker-compose -f docker-compose.prod.yml build` - ARM64 build for t4g instances

## Architecture Overview

### Project Structure
This is a monorepo with a Clean Architecture backend and React/TypeScript frontend:

**Backend (`apps/backend/src/`):**
- **Domain Layer** (`domain/`): Core business entities, value objects, services, and repository interfaces
- **Application Layer** (`application/`): Use cases, DTOs, mappers, and application services
- **Infrastructure Layer** (`infrastructure/`): Database implementations, external APIs, DI container
- **Presentation Layer** (`presentation/`): Controllers, routes, middleware, and Express server setup

**Frontend (`apps/frontend/src/`):**
- React application with TypeScript, Vite, and Tailwind CSS
- Uses React Query for state management and API calls
- Component-based architecture with reusable UI components

### Key Domain Concepts
- **Projects**: Core entity supporting PV (solar) and BESS (battery) energy storage systems
- **Leads**: CRM functionality for managing potential customers with interaction tracking
- **Users**: Authentication and user management with role-based permissions and team support
- **Model3D**: 3D model upload and management for solar panel placement and site analysis
- **Calculations**: Solar system sizing, BESS calculations, and financial analysis with PVGIS integration
- **Equipment**: Solar modules, inverters, and battery equipment with seeding capabilities
- **Areas**: Area montagem (installation area) calculations for solar panels
- **Proposals**: Template-based proposal generation with advanced configurations

### Database & Infrastructure
- **MongoDB**: Primary database using Mongoose ODM with authentication required in production
- **Redis**: Caching and session storage with password protection
- **Docker**: Complete containerized development environment with ARM64 support
- **JWT**: Dual-token authentication system (access + refresh tokens) with blacklisting support
- **External APIs**: Google Solar API and PVGIS for solar irradiation data

### Dependency Injection Architecture
The backend uses a sophisticated DI container (`infrastructure/di/Container.ts`) with:
- **Service Registration**: All repositories, services, and use cases are registered with tokens
- **Factory Pattern**: Services are created through factory functions with proper dependency resolution  
- **Layered Dependencies**: Clean separation between domain, application, and infrastructure layers
- **Bootstrap Process**: Application startup through `ApplicationBootstrap.ts` handles DI configuration

### Clean Architecture Implementation
**Repository Pattern**: All data access through interfaces (e.g., `IUserRepository`) with MongoDB implementations
**Use Case Pattern**: Business logic encapsulated in use cases (e.g., `CreateProjectUseCase`, `CalculateSolarSystemUseCase`)
**Service Layer**: Domain services handle complex business rules, application services orchestrate use cases
**Controller Layer**: Express controllers handle HTTP concerns, delegating to use cases

### API Structure
REST API with versioning (`/api/v1/`) supporting:
- **Authentication**: `/auth` - JWT-based auth with refresh token support
- **Project Management**: `/projects` - CRUD operations with PV/BESS project types
- **Lead Management**: `/leads` - CRM functionality with interaction tracking
- **3D Model Handling**: `/models-3d` - File upload with validation
- **Calculation Services**: `/calculations` - Solar system and BESS sizing algorithms
- **Client Management**: `/clients` - Customer data with lead conversion
- **Equipment**: Solar modules, inverters with seeding endpoints

### Frontend Architecture
- **Environment Detection**: API base URL automatically switches between development (localhost:8010) and production (api.besspro.vizad.com.br)
- **State Management**: React Query for server state, React hooks for local state  
- **Authentication**: JWT tokens stored in localStorage with automatic refresh
- **Error Handling**: Global error interceptors with user-friendly toast notifications

## Production Deployment

### Environment Configuration
Production uses `.env.production` with specific variable names:
- `JWT_SECRET` (not JWT_SECRET_KEY) - Must be 32+ characters (256 bits)
- `JWT_REFRESH_SECRET` (not JWT_REFRESH_SECRET_KEY) - Must be different from JWT_SECRET
- `MONGODB_URI` - Must include authentication: `mongodb://admin:password@mongodb:27017/db?authSource=admin`

### ARM64 Deployment (AWS t4g instances)
- Use `DOCKER_DEFAULT_PLATFORM=linux/arm64` for builds
- Rollup ARM64 dependency added automatically: `@rollup/rollup-linux-arm64-musl`
- TypeScript path aliases resolved at build time using `tsc-alias`

### Docker Configurations
- **Development**: `docker-compose.yml` - Full development environment with hot reload
- **Production**: `docker-compose.prod.yml` - Optimized production builds with health checks
- **Simple**: `docker-compose.simple.yml` - Exposed ports for external nginx proxy

### Production Architecture
- Frontend serves static files on port 3003
- Backend API on port 8010  
- External nginx handles SSL termination and proxying
- MongoDB with authentication enabled
- Redis with password protection

## Development Notes

### Environment Requirements
- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker and Docker Compose for full stack development

### Port Configuration
- **Development**: Frontend (3003), Backend (8010), MongoDB (27017), Redis (6380), Mailpit (8026)
- **Production**: Frontend (3003), Backend (8010), MongoDB (internal), Redis (internal)

### TypeScript Path Resolution
- Uses `@/*` path aliases for clean imports
- Backend: Resolved at build time with `tsc-alias`
- Frontend: Resolved by Vite automatically
- Development: Uses `tsconfig-paths/register` for ts-node

### Key Files to Understand
- `apps/backend/src/presentation/bootstrap/ApplicationBootstrap.ts` - Application startup and DI container setup
- `apps/backend/src/infrastructure/di/ContainerSetup.ts` - Service registration and factory definitions
- `apps/backend/src/infrastructure/config/AppConfig.ts` - Environment variable mapping and configuration
- `apps/frontend/src/lib/api.ts` - Frontend API client with environment detection
- `docker-compose*.yml` - Various deployment configurations
- `.env.production` - Production environment variables (not in git)