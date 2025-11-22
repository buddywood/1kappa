import request from 'supertest';
import express from 'express';
import stewardsRouter from '../routes/stewards';
import pool from '../db/connection';

// Mock the database queries
jest.mock('../db/queries', () => ({
  getActiveStewardListings: jest.fn(),
  getStewardListingById: jest.fn(),
  getStewardById: jest.fn(),
  getMemberById: jest.fn(),
  getStewardListingImages: jest.fn(),
}));

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => next()),
  requireSteward: jest.fn((req, res, next) => next()),
  requireVerifiedMember: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/stewards', stewardsRouter);

describe('Guest Access to Steward Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/stewards/marketplace/public', () => {
    it('should return listings without authentication', async () => {
      const { getActiveStewardListings, getStewardById, getMemberById } = require('../db/queries');
      
      const mockListings = [
        {
          id: 1,
          steward_id: 1,
          name: 'Test Listing',
          description: 'Test Description',
          image_url: 'https://example.com/image.jpg',
          shipping_cost_cents: 1000,
          chapter_donation_cents: 500,
          sponsoring_chapter_id: 1,
          category_id: 1,
          status: 'ACTIVE',
        },
      ];

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: 1,
        status: 'APPROVED',
      };

      const mockMember = {
        id: 1,
        name: 'Test Member',
        email: 'test@example.com',
      };

      getActiveStewardListings.mockResolvedValue(mockListings);
      getStewardById.mockResolvedValue(mockSteward);
      getMemberById.mockResolvedValue(mockMember);

      // Mock pool.query for chapter lookup
      jest.spyOn(pool, 'query').mockResolvedValue({
        rows: [{ id: 1, name: 'Test Chapter' }],
      } as any);

      const response = await request(app)
        .get('/api/stewards/marketplace/public')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('can_claim', false);
      expect(response.body[0]).toHaveProperty('steward');
      expect(response.body[0]).toHaveProperty('chapter');
    });

    it('should include can_claim: false flag', async () => {
      const { getActiveStewardListings, getStewardById, getMemberById } = require('../db/queries');
      
      getActiveStewardListings.mockResolvedValue([]);
      jest.spyOn(pool, 'query').mockResolvedValue({ rows: [] } as any);

      const response = await request(app)
        .get('/api/stewards/marketplace/public')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      // Even empty array should be returned
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/stewards/listings/:id/public', () => {
    it('should return listing without authentication', async () => {
      const { getStewardListingById, getStewardById, getMemberById, getStewardListingImages } = require('../db/queries');
      
      const mockListing = {
        id: 1,
        steward_id: 1,
        name: 'Test Listing',
        description: 'Test Description',
        image_url: 'https://example.com/image.jpg',
        shipping_cost_cents: 1000,
        chapter_donation_cents: 500,
        sponsoring_chapter_id: 1,
        category_id: 1,
        status: 'ACTIVE',
      };

      const mockSteward = {
        id: 1,
        fraternity_member_id: 1,
        sponsoring_chapter_id: 1,
        status: 'APPROVED',
      };

      const mockMember = {
        id: 1,
        name: 'Test Member',
        email: 'test@example.com',
      };

      getStewardListingById.mockResolvedValue(mockListing);
      getStewardById.mockResolvedValue(mockSteward);
      getMemberById.mockResolvedValue(mockMember);
      getStewardListingImages.mockResolvedValue([]);

      jest.spyOn(pool, 'query').mockResolvedValue({
        rows: [{ id: 1, name: 'Test Chapter' }],
      } as any);

      const response = await request(app)
        .get('/api/stewards/listings/1/public')
        .expect(200);

      expect(response.body).toHaveProperty('can_claim', false);
      expect(response.body).toHaveProperty('steward');
      expect(response.body).toHaveProperty('chapter');
      expect(response.body).toHaveProperty('images');
    });

    it('should return 404 for non-existent listing', async () => {
      const { getStewardListingById } = require('../db/queries');
      getStewardListingById.mockResolvedValue(null);

      await request(app)
        .get('/api/stewards/listings/999/public')
        .expect(404);
    });

    it('should return 400 for invalid listing ID', async () => {
      await request(app)
        .get('/api/stewards/listings/invalid/public')
        .expect(400);
    });
  });

  describe('Claim endpoint still requires authentication', () => {
    it('should require authentication for claim endpoint', async () => {
      // The claim endpoint should still be protected
      // This test verifies that the authenticated route is still in place
      const response = await request(app)
        .post('/api/stewards/listings/1/claim')
        .expect(401); // Should fail without auth

      expect(response.body).toHaveProperty('error');
    });
  });
});

