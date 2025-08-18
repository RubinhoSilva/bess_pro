# 🤝 Guia de Contribuição - BESS Pro

Obrigado por considerar contribuir com o BESS Pro! Este documento contém as diretrizes para contribuir com o projeto.

## 📋 Processo de Contribuição

### 1. **Fork e Clone**
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/your-username/bess-pro.git
cd bess-pro

# Adicione o remote upstream
git remote add upstream https://github.com/original-owner/bess-pro.git
```

### 2. **Setup do Ambiente**
```bash
# Instalar dependências
npm run install:all

# Subir ambiente de desenvolvimento
npm run docker:up

# Verificar se tudo está funcionando
npm run dev
```

### 3. **Criar Branch para Feature**
```bash
# Criar branch descritiva
git checkout -b feature/user-authentication
# ou
git checkout -b fix/dashboard-loading-issue
# ou
git checkout -b docs/api-documentation
```

### 4. **Desenvolver e Testar**
```bash
# Fazer suas alterações
# Executar testes
npm run test

# Verificar linting
npm run lint

# Testar build
npm run build
```

### 5. **Commit das Alterações**
```bash
# Adicionar arquivos modificados
git add .

# Commit seguindo padrão Conventional Commits
git commit -m "feat: add user authentication system"
```

### 6. **Push e Pull Request**
```bash
# Push para seu fork
git push origin feature/user-authentication

# Criar Pull Request no GitHub
```

## 📝 Padrões de Código

### **Conventional Commits**
Use o padrão [Conventional Commits](https://www.conventionalcommits.org/) para mensagens de commit:

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação de código
refactor: refatoração
test: adição de testes
chore: tarefas de manutenção
```

**Exemplos:**
- `feat: add solar panel calculator`
- `fix: resolve authentication redirect issue`
- `docs: update API documentation`
- `test: add unit tests for auth service`

### **Estrutura de Branches**
- `main`: branch principal (produção)
- `develop`: branch de desenvolvimento
- `feature/*`: novas funcionalidades
- `fix/*`: correções de bugs
- `hotfix/*`: correções urgentes
- `docs/*`: documentação

### **Padrões de Código**

**TypeScript:**
```typescript
// ✅ Bom
interface UserData {
  id: string;
  name: string;
  email: string;
}

const createUser = async (userData: UserData): Promise<User> => {
  // implementação
};

// ❌ Evitar
const createUser = async (data: any) => {
  // implementação
};
```

**React Components:**
```tsx
// ✅ Bom
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  onClick 
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Backend Services:**
```typescript
// ✅ Seguir Clean Architecture
export class CreateUserUseCase implements IUseCase<CreateUserCommand, Result<UserResponseDto>> {
  constructor(
    private userRepository: IUserRepository,
    private passwordHashService: IPasswordHashService
  ) {}

  async execute(command: CreateUserCommand): Promise<Result<UserResponseDto>> {
    // implementação
  }
}
```

## 🧪 Testes

### **Executar Testes**
```bash
# Todos os testes
npm run test

# Testes específicos
npm run test:backend
npm run test:frontend

# Testes com watch mode
npm run test -- --watch
```

### **Escrever Testes**

**Backend (Jest):**
```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    useCase = new CreateUserUseCase(userRepository, passwordService);
  });

  it('should create user successfully', async () => {
    // Arrange
    const command = { name: 'John', email: 'john@example.com', password: '123456' };
    
    // Act
    const result = await useCase.execute(command);
    
    // Assert
    expect(result.isSuccess).toBe(true);
    expect(userRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

**Frontend (Vitest):**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 📚 Documentação

### **Documentar APIs**
```typescript
/**
 * Creates a new user in the system
 * @param userData - User information
 * @returns Promise with created user data
 * @throws UserAlreadyExistsError when email is already registered
 */
export const createUser = async (userData: CreateUserRequest): Promise<UserResponse> => {
  // implementação
};
```

### **Documentar Componentes**
```tsx
/**
 * Button component with multiple variants
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 */
export interface ButtonProps {
  /** Button content */
  children: React.ReactNode;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Click handler */
  onClick?: () => void;
}
```

## 🔧 Setup de Desenvolvimento

### **Ferramentas Recomendadas**
- **VSCode** com extensões:
  - TypeScript
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Docker
- **Postman** ou **Insomnia** para testes de API
- **MongoDB Compass** para visualização do banco

### **Configuração do VSCode**
Crie `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

## 🚀 Deploy e CI/CD

### **Preparar para Deploy**
```bash
# Build de produção
npm run build

# Testar build localmente
docker-compose -f docker-compose.prod.yml up --build
```

### **Variáveis de Ambiente**
Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas:
- Copie `.env.example` para `.env` em cada aplicação
- Configure valores apropriados para seu ambiente
- **NUNCA** commite arquivos `.env` com dados sensíveis

## 🐛 Reportar Bugs

### **Template de Issue**
```markdown
**Descrição do Bug**
Descrição clara e concisa do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado**
Descrição do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Safari]
- Versão: [e.g. 22]
- Node.js: [e.g. 20.1.0]
```

## 💡 Solicitar Features

### **Template de Feature Request**
```markdown
**Resumo da Feature**
Descrição clara e concisa da feature desejada.

**Motivação**
Por que esta feature seria útil?

**Solução Proposta**
Descrição detalhada de como a feature deveria funcionar.

**Alternativas Consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Qualquer outro contexto ou screenshots sobre a feature.
```

## 🎯 Áreas que Precisam de Ajuda

Atualmente, estamos buscando contribuições nas seguintes áreas:

- [ ] **Testes automatizados** - Aumentar coverage de testes
- [ ] **Documentação** - Melhorar docs de API e componentes
- [ ] **Acessibilidade** - Implementar padrões WCAG
- [ ] **Performance** - Otimizações de bundle e queries
- [ ] **Internacionalização** - Suporte a múltiplos idiomas
- [ ] **Design System** - Expandir biblioteca de componentes

## 📞 Suporte

- **Dúvidas gerais**: Abra uma [Discussion](https://github.com/owner/bess-pro/discussions)
- **Bugs**: Abra uma [Issue](https://github.com/owner/bess-pro/issues)
- **Chat**: Entre no nosso [Discord/Slack]

## 📄 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença MIT do projeto.

---

**Obrigado por contribuir com o BESS Pro! 🚀**