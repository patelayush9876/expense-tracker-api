import { User } from '@prisma/client';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  username: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
