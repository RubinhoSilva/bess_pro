# Development Commands

## Build/Lint/Test
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both applications  
- `npm run lint` - Lint both applications
- `npm run test` - Run all tests
- `npm run test:backend` - Run backend tests (Jest)
- `npm run test:frontend` - Run frontend tests (Vitest)
- `npm run test:watch` - Run backend tests in watch mode
- Single test: `npm run test -- --testNamePattern="test name"`

## Code Style Guidelines

### TypeScript & Imports
- Use strict TypeScript with proper typing
- Backend: CommonJS modules, Frontend: ES modules
- Path aliases: `@/*` for both apps (configured in tsconfig)
- Import order: external libs → internal modules → relative imports
- Use class-validator for DTO validation, class-transformer for serialization

### Naming Conventions
- Classes: PascalCase (e.g., `UserService`, `ProjectEntity`)
- Interfaces: Prefix with `I` (e.g., `IUserRepository`)
- Files: kebab-case for folders, PascalCase for class files
- Constants: UPPER_SNAKE_CASE
- Functions/variables: camelCase

### Architecture Patterns
- Backend: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- Use dependency injection container in `infrastructure/di/`
- Repository pattern with interfaces, MongoDB implementations
- Use cases for business logic, controllers for HTTP handling
- Frontend: React with TypeScript, React Query for state management

### Error Handling
- Backend: Use custom exceptions in `domain/exceptions/`
- Return standardized error responses with proper HTTP status codes
- Frontend: Global error interceptors with toast notifications
- Always handle async errors with try/catch or .catch()

### Testing
- Backend: Jest with supertest for API tests
- Frontend: Vitest with React Testing Library
- Test files: `*.test.ts` or `*.spec.ts`
- Mock external dependencies and database connections

## Senior Architect Agent

### Overview
- **Location**: `agents/senior-architect.ts`
- **Experience**: 15+ years in software architecture and energy systems
- **Specializations**: Clean Architecture, Domain-Driven Design, Solar PV Engineering, Enterprise Software

### Capabilities
- **Architecture Analysis**: Deep code review, scalability planning, technical debt evaluation
- **Energy Systems**: Solar calculations validation, system optimization, financial model auditing
- **Technical Guidance**: Best practices recommendations, development roadmaps, technology stack advice
- **Risk Assessment**: Security analysis, performance bottlenecks, mitigation strategies

### Usage
```typescript
import { SeniorArchitectAgent } from './agents/senior-architect';

const architect = new SeniorArchitectAgent();
const analysis = await architect.analyzeArchitecture('./apps/backend');
const guidance = await architect.provideTechnicalGuidance(context);
```

### When to Use
- Major architectural decisions
- Performance optimization initiatives
- Technical debt prioritization
- Solar system design validation
- Code quality assessments
- Technology stack evaluations