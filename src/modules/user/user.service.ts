import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    if (data.username) {
      const existingUsername = await this.userRepository.findByUsername(
        data.username,
      );
      if (existingUsername) {
        throw new ConflictException('A user with this username already exists');
      }
    }

    return this.userRepository.create(data);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    // Ensure user exists
    await this.findById(id);

    if (data.email && typeof data.email === 'string') {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    if (data.username && typeof data.username === 'string') {
      const existingUsername = await this.userRepository.findByUsername(
        data.username,
      );
      if (existingUsername && existingUsername.id !== id) {
        throw new ConflictException('A user with this username already exists');
      }
    }

    return this.userRepository.update(id, data);
  }

  async remove(id: string): Promise<User> {
    await this.findById(id);
    return this.userRepository.delete(id);
  }

  async getSettings(userId: string) {
    const settings = await this.userRepository.findSettings(userId);
    if (!settings) {
      throw new NotFoundException(`Settings for user ${userId} not found`);
    }
    return settings;
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    await this.findById(userId);
    return this.userRepository.updateSettings(userId, data);
  }
}
