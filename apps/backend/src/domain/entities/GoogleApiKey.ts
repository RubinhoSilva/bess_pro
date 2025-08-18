import { UserId } from "../value-objects/UserId";

export interface GoogleApiKeyProps {
  id?: string;
  userId: string;
  apiKey: string;
}

export class GoogleApiKey {
  private constructor(
    private readonly id: string,
    private readonly userId: UserId,
    private readonly apiKey: string,
    private readonly createdAt: Date = new Date()
  ) {}

  static create(props: GoogleApiKeyProps): GoogleApiKey {
    const id = props.id || crypto.randomUUID();
    const userId = UserId.create(props.userId);

    if (!props.apiKey || props.apiKey.trim().length === 0) {
      throw new Error('API Key é obrigatória');
    }

    if (props.apiKey.length < 10) {
      throw new Error('API Key muito curta');
    }

    return new GoogleApiKey(
      id,
      userId,
      props.apiKey.trim(),
      new Date()
    );
  }

  isOwnedBy(userId: UserId): boolean {
    return this.userId.equals(userId);
  }

  isValid(): boolean {
    // Validação básica - em produção seria validada contra a API do Google
    return this.apiKey.length >= 10 && this.apiKey.includes('AIza');
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): UserId { return this.userId; }
  getApiKey(): string { return this.apiKey; }
  getCreatedAt(): Date { return this.createdAt; }
}