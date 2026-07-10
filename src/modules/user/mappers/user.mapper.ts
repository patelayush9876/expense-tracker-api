import { User } from '@prisma/client';

export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  username: string | null;
  isEmailVerified: boolean;
  settings?: {
    id: string;
    userId: string;
    currency: string;
    theme: string;
    notificationsEnabled: boolean;
    subscriptionPlan: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      isEmailVerified: user.isEmailVerified,
      settings: user.settings
        ? {
            id: user.settings.id,
            userId: user.settings.userId,
            currency: user.settings.currency,
            theme: user.settings.theme,
            notificationsEnabled: user.settings.notificationsEnabled,
            subscriptionPlan: user.settings.subscriptionPlan,
            createdAt: user.settings.createdAt,
            updatedAt: user.settings.updatedAt,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
