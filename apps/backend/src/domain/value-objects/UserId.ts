export class UserId {
  private constructor(private readonly value: string) {}

  static create(id: string): UserId {
    if (!id || id.trim().length === 0) {
      throw new Error('UserId não pode estar vazio');
    }
    return new UserId(id);
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.getValue();
  }
}