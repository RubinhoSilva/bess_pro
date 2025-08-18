import { UserProps } from "../entities/User";
import { Email } from "./Email";
import { Name } from "./Name";
import { UserId } from "./UserId";
import { UserRole } from "./UserRole";
import { Company } from "./Company";

export class User {
  private constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private name: Name,
    private company: Company,
    private role: UserRole
  ) {}

  static create(props: UserProps): User {
    return new User(
      props.id ? UserId.create(props.id) : UserId.generate(),
      Email.create(props.email),
      Name.create(props.name),
      Company.create(props.company || ''),
      UserRole.create(props.role)
    );
  }

  changeName(newName: Name): void {
    // Regras de negócio para mudança de nome
    this.name = newName;
  }

  // Getters
  getId(): UserId { return this.id; }
  getEmail(): Email { return this.email; }
}