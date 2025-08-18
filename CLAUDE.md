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
- `npm run build:backend` - Build backend TypeScript to JavaScript
- `npm run test:backend` - Run backend tests with Jest
- `npm run test:watch` - Run backend tests in watch mode

### Frontend Commands (apps/frontend)
- `npm run dev:frontend` - Start frontend development server with Vite
- `npm run build:frontend` - Build frontend for production
- `npm run test:frontend` - Run frontend tests with Vitest

### Docker Commands
- `npm run docker:up` - Start all services with Docker Compose
- `npm run docker:down` - Stop all Docker services

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
- **Projects**: Core entity supporting PV (solar) and BESS (battery) types
- **Leads**: CRM functionality for managing potential customers
- **Users**: Authentication and user management with role-based permissions
- **Model3D**: 3D model upload and management for solar panel placement
- **Calculations**: Solar system sizing and financial analysis

### Database & Infrastructure
- **MongoDB**: Primary database using Mongoose ODM
- **Redis**: Caching and session storage
- **Docker**: Complete containerized development environment
- **JWT**: Authentication with access and refresh tokens

### Dependency Injection
The backend uses a custom DI container (`infrastructure/di/Container.ts`) for service registration and resolution. Services are configured in the bootstrap process.

### Testing Strategy
- **Backend**: Jest with unit and integration tests
- **Frontend**: Vitest for component and utility testing
- Tests are located in respective `tests/` directories

### API Structure
REST API with versioning (`/api/v1/`) supporting:
- Authentication endpoints (`/auth`)
- Project management (`/projects`)
- Lead management (`/leads`)
- 3D model handling (`/models-3d`)
- Calculation services (`/calculations`)

## Development Notes

### Environment Requirements
- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker and Docker Compose for full stack development

### Port Configuration
- Frontend: http://localhost:3003
- Backend: http://localhost:8010
- MongoDB: localhost:27017
- Redis: localhost:6380

### Key Files to Understand
- `apps/backend/src/presentation/bootstrap/ApplicationBootstrap.ts` - Application startup
- `apps/backend/src/infrastructure/di/Container.ts` - Dependency injection setup
- `apps/frontend/src/lib/api.ts` - Frontend API client configuration
- `docker-compose.yml` - Development environment setup