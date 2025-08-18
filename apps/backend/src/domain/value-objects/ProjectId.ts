export class ProjectId {
  private constructor(private readonly value: string) {}

  static create(id: string): ProjectId {
    if (!id || id.trim().length === 0) {
      throw new Error('ProjectId não pode estar vazio');
    }
    return new ProjectId(id);
  }

  static generate(): ProjectId {
    return new ProjectId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: ProjectId): boolean {
    return this.value === other.getValue();
  }
}