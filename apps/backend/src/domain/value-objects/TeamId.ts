export class TeamId {
  private constructor(private readonly value: string) {}

  static create(id: string): TeamId {
    if (!id || id.trim().length === 0) {
      throw new Error('ID do team é obrigatório');
    }
    return new TeamId(id);
  }

  static generate(): TeamId {
    const { randomUUID } = require('crypto');
    return new TeamId(randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: TeamId): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}