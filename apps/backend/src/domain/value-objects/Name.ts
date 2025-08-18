export class Name {
  private constructor(private readonly value: string) {}

  static create(name: string): Name {
    if (!name || name.trim().length < 2) {
      throw new Error('Nome deve ter pelo menos 2 caracteres');
    }
    if (name.trim().length > 100) {
      throw new Error('Nome não pode ter mais de 100 caracteres');
    }
    return new Name(name.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Name): boolean {
    return this.value === other.getValue();
  }
}