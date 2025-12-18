// @ts-nocheck

import { Op } from 'sequelize';
import { Notification as NotificationModel } from './models';

export interface Notification {
  id: number;
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ADMIN_ACTION';
  title: string;
  message: string;
  related_product_id: number | null;
  related_order_id: number | null;
  is_read: boolean;
  created_at: Date;
  read_at: Date | null;
}

export async function createNotification(notification: {
  user_email: string;
  type: 'PURCHASE_BLOCKED' | 'ITEM_AVAILABLE' | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ADMIN_ACTION';
  title: string;
  message: string;
  related_product_id?: number | null;
  related_order_id?: number | null;
}): Promise<Notification> {
  const newNotification = await NotificationModel.create({
    user_email: notification.user_email,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    related_product_id: notification.related_product_id || null,
    related_order_id: notification.related_order_id || null,
    is_read: false
  });
  return newNotification.toJSON() as Notification;
}

export async function getNotificationsByUser(userEmail: string, limit: number = 50): Promise<Notification[]> {
  const notifications = await NotificationModel.findAll({
    where: { user_email: userEmail },
    order: [['created_at', 'DESC']],
    limit
  });
  return notifications.map(n => n.toJSON() as Notification);
}

export async function getUnreadNotificationCount(userEmail: string): Promise<number> {
  const count = await NotificationModel.count({
    where: {
      user_email: userEmail,
      is_read: false
    }
  });
  return count;
}

export async function markNotificationAsRead(notificationId: number, userEmail: string): Promise<boolean> {
  const [updated] = await NotificationModel.update(
    {
      is_read: true,
      read_at: new Date()
    },
    {
      where: {
        id: notificationId,
        user_email: userEmail
      }
    }
  );
  return updated > 0;
}

export async function markAllNotificationsAsRead(userEmail: string): Promise<number> {
  const [updated] = await NotificationModel.update(
    {
      is_read: true,
      read_at: new Date()
    },
    {
      where: {
        user_email: userEmail,
        is_read: false
      }
    }
  );
  return updated;
}

export async function getNotificationsForProduct(productId: number, type: string): Promise<Notification[]> {
  const notifications = await NotificationModel.findAll({
    where: {
      related_product_id: productId,
      type: type as any,
      is_read: false
    }
  });
  return notifications.map(n => n.toJSON() as Notification);
}

export async function deleteNotification(notificationId: number, userEmail: string): Promise<boolean> {
  const result = await NotificationModel.destroy({
    where: {
      id: notificationId,
      user_email: userEmail
    }
  });
  return result > 0;
}

// Get all users who tried to purchase a product but couldn't (for notifying when item becomes available)
export async function getInterestedUsersForProduct(productId: number): Promise<string[]> {
  const notifications = await NotificationModel.findAll({
    where: {
      related_product_id: productId,
      type: 'PURCHASE_BLOCKED',
      is_read: false
    },
    attributes: ['user_email'],
    group: ['user_email']
  });
  return notifications.map(n => n.user_email);
}

