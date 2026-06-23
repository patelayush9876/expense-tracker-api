import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async create(
    userId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    return this.repository.create({
      userId,
      title,
      message,
    });
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.repository.findMany(userId);
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.repository.findById(id);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return this.repository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    return this.repository.updateMany(userId, { isRead: true });
  }
}
