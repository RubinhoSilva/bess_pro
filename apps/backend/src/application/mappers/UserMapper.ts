import { User } from '../../domain/entities/User';
import { UserResponseDto } from '../dtos/output/UserResponseDto';

export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.getId(),
      email: user.getEmail().getValue(),
      name: user.getName().getValue(),
      company: user.getCompany(),
      role: user.getRole().getValue(),
      teamId: user.getTeamId() || undefined,
      status: user.getStatus(),
      logoUrl: user.getLogoUrl(),
      createdAt: user.getCreatedAt().toISOString(),
    };
  }

  static toResponseDtoList(users: User[]): UserResponseDto[] {
    return users.map(user => this.toResponseDto(user));
  }
}