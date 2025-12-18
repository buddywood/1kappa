/**
 * Admin Management Integration Tests
 * 
 * Tests the new admin functionality for product and event management:
 * - Query level functions in queries-sequelize.ts
 * - API level endpoints in admin.ts
 * - Triggering of notifications and emails
 */

import request from 'supertest';
import express from 'express';
import adminRouter from '../routes/admin';
import * as queries from '../db/queries-sequelize';
import * as emailService from '../services/email';
import * as notificationService from '../services/notifications';
import pool from '../db/connection';

// Mock the database queries
jest.mock('../db/queries-sequelize');
jest.mock('../db/connection');

// Mock services
jest.mock('../services/email', () => ({
  sendProductModifiedEmail: jest.fn().mockResolvedValue(undefined),
  sendProductDeletedEmail: jest.fn().mockResolvedValue(undefined),
  sendEventModifiedEmail: jest.fn().mockResolvedValue(undefined),
  sendEventDeletedEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/s3', () => ({
  uploadToS3: jest.fn().mockResolvedValue({ url: 'https://s3.example.com/admin-uploads/test.jpg' }),
}));

jest.mock('../services/notifications', () => ({
  notifyProductModified: jest.fn().mockResolvedValue(undefined),
  notifyProductDeleted: jest.fn().mockResolvedValue(undefined),
  notifyEventModified: jest.fn().mockResolvedValue(undefined),
  notifyEventDeleted: jest.fn().mockResolvedValue(undefined),
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 1,
      cognitoSub: 'admin-cognito-sub',
      email: 'admin@example.com',
      role: 'ADMIN',
      sellerId: null,
      promoterId: null,
      stewardId: null,
      features: {},
    };
    next();
  }),
  requireAdmin: jest.fn((req: any, res: any, next: any) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/admin', adminRouter);

describe('Admin Management API & Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Common Routes', () => {
    it('POST /api/admin/upload should upload an image', async () => {
      const { uploadToS3 } = require('../services/s3');
      const response = await request(app)
        .post('/api/admin/upload')
        .attach('image', Buffer.from('fake-image-data'), 'test.jpg')
        .expect(200);

      expect(uploadToS3).toHaveBeenCalled();
      expect(response.body.url).toBe('https://s3.example.com/admin-uploads/test.jpg');
    });
  });

  describe('Product Management', () => {
    const mockProduct = {
      id: 101,
      seller_id: 1,
      name: 'Test Product',
      description: 'Test description',
      price_cents: 1000,
      status: 'ACTIVE',
      owner_email: 'seller@example.com',
      owner_name: 'Test Seller'
    };

    it('GET /api/admin/products should return all products', async () => {
      (queries.getAllProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const response = await request(app)
        .get('/api/admin/products')
        .expect(200);

      expect(queries.getAllProducts).toHaveBeenCalled();
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(101);
    });

    it('GET /api/admin/products/:id should return a specific product', async () => {
      (queries.getProductWithOwnerInfo as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/admin/products/101')
        .expect(200);

      expect(queries.getProductWithOwnerInfo).toHaveBeenCalledWith(101);
      expect(response.body.name).toBe('Test Product');
    });

    it('PUT /api/admin/products/:id should update product and send notifications', async () => {
      (queries.getProductWithOwnerInfo as jest.Mock).mockResolvedValue(mockProduct);
      (queries.updateProduct as jest.Mock).mockResolvedValue({ ...mockProduct, name: 'Updated Product' });

      const response = await request(app)
        .put('/api/admin/products/101')
        .send({
          name: 'Updated Product',
          reason: 'Correction'
        })
        .expect(200);

      expect(queries.updateProduct).toHaveBeenCalledWith(101, expect.objectContaining({ name: 'Updated Product' }));
      expect(emailService.sendProductModifiedEmail).toHaveBeenCalled();
      expect(notificationService.notifyProductModified).toHaveBeenCalled();
      expect(response.body.name).toBe('Updated Product');
    });

    it('DELETE /api/admin/products/:id should soft delete product and send notifications', async () => {
      (queries.getProductWithOwnerInfo as jest.Mock).mockResolvedValue(mockProduct);
      (queries.deleteProduct as jest.Mock).mockResolvedValue({ ...mockProduct, status: 'ADMIN_DELETE' });

      await request(app)
        .delete('/api/admin/products/101')
        .send({ reason: 'Policy violation' })
        .expect(200);

      expect(queries.deleteProduct).toHaveBeenCalledWith(101);
      expect(emailService.sendProductDeletedEmail).toHaveBeenCalled();
      expect(notificationService.notifyProductDeleted).toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    const mockEvent = {
      id: 201,
      promoter_id: 2,
      title: 'Test Event',
      description: 'Test event description',
      event_date: new Date().toISOString(),
      location: 'Test Location',
      status: 'ACTIVE',
      owner_email: 'promoter@example.com',
      owner_name: 'Test Promoter'
    };

    it('GET /api/admin/events should return all events', async () => {
      (queries.getAllEventsForAdmin as jest.Mock).mockResolvedValue([mockEvent]);

      const response = await request(app)
        .get('/api/admin/events')
        .expect(200);

      expect(queries.getAllEventsForAdmin).toHaveBeenCalled();
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(201);
    });

    it('PUT /api/admin/events/:id should update event and send notifications', async () => {
      (queries.getEventWithOwnerInfo as jest.Mock).mockResolvedValue(mockEvent);
      (queries.updateEvent as jest.Mock).mockResolvedValue({ ...mockEvent, title: 'Updated Event' });

      const response = await request(app)
        .put('/api/admin/events/201')
        .send({
          title: 'Updated Event',
          reason: 'Scheduling'
        })
        .expect(200);

      expect(queries.updateEvent).toHaveBeenCalledWith(201, expect.objectContaining({ title: 'Updated Event' }));
      expect(emailService.sendEventModifiedEmail).toHaveBeenCalled();
      expect(notificationService.notifyEventModified).toHaveBeenCalled();
      expect(response.body.title).toBe('Updated Event');
    });

    it('DELETE /api/admin/events/:id should soft delete event and send notifications', async () => {
      (queries.getEventWithOwnerInfo as jest.Mock).mockResolvedValue(mockEvent);
      (queries.deleteEvent as jest.Mock).mockResolvedValue({ ...mockEvent, status: 'CANCELLED' });

      await request(app)
        .delete('/api/admin/events/201')
        .send({ reason: 'Cancellation' })
        .expect(200);

      expect(queries.deleteEvent).toHaveBeenCalledWith(201);
      expect(emailService.sendEventDeletedEmail).toHaveBeenCalled();
      expect(notificationService.notifyEventDeleted).toHaveBeenCalled();
    });
  });
});
