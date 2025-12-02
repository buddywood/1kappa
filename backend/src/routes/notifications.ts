import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import {
  getNotificationsByUser,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../db/queries-notifications-sequelize';
import { z } from 'zod';

const router: ExpressRouter = Router();

// Get all notifications for a user
router.get('/:userEmail', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await getNotificationsByUser(userEmail, limit);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/:userEmail/count', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const count = await getUnreadNotificationCount(userEmail);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ error: 'Failed to fetch notification count' });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }

    const success = await markNotificationAsRead(parseInt(notificationId), userEmail);
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/:userEmail/read-all', async (req: Request, res: Response) => {
  try {
    const { userEmail } = req.params;
    const count = await markAllNotificationsAsRead(userEmail);
    res.json({ count });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'userEmail is required' });
    }

    const success = await deleteNotification(parseInt(notificationId), userEmail);
    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;

