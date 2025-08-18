import { ValueError } from "../common/ValueError";

export class Company {
  private constructor(private readonly value: string) {}

  static create(company: string): Company {
    if (!company || company.trim().length === 0) {
      throw new ValueError('Nome da empresa não pode estar vazio');
    }

    if (company.trim().length < 2) {
      throw new ValueError('Nome da empresa deve ter pelo menos 2 caracteres');
    }

    if (company.trim().length > 200) {
      throw new ValueError('Nome da empresa não pode ter mais de 200 caracteres');
    }

    return new Company(company.trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Company): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}