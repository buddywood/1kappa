/**
 * Query Parity Tests
 * 
 * NOTE: These tests are skipped after migration completion.
 * They were used to validate the migration from raw SQL to Sequelize.
 * Old query files have been removed after successful validation.
 */

// Skipping these tests as old query files have been removed after successful migration validation
describe.skip('Query Parity Tests (Migration Validation Complete)', () => {
  it('should be skipped - migration validation complete', () => {
    expect(true).toBe(true);
  });
});

// Original test code preserved for reference but not executed
/*
import { setupTestDatabase, teardownTestDatabase, getTestData, closeDatabaseConnections } from './helpers/db-setup';
import * as newQueries from '../db/queries-sequelize';
import * as newAddressQueries from '../db/queries-addresses-sequelize';
import * as newNotificationQueries from '../db/queries-notifications-sequelize';

// Helper to normalize objects for comparison (handles Date, JSONB, etc.)
function normalizeForComparison(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(normalizeForComparison).sort((a, b) => {
      // Sort by id if available
      if (a.id && b.id) {
        return a.id - b.id;
      }
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });
  }
  
  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        normalized[key] = normalizeForComparison(obj[key]);
      }
    }
    return normalized;
  }
  
  return obj;
}

// Helper to compare two results
function compareResults(oldResult: any, newResult: any, testName: string): void {
  const normalizedOld = normalizeForComparison(oldResult);
  const normalizedNew = normalizeForComparison(newResult);
  
  expect(normalizedNew).toEqual(normalizedOld);
}

describe('Query Parity Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase(true);
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
    await closeDatabaseConnections();
  });
  
  beforeEach(async () => {
    // Clean and reseed before each test to ensure consistent state
    await teardownTestDatabase();
    await setupTestDatabase(true);
  });
  
  describe('Chapter Queries', () => {
    it('getAllChapters should return identical results', async () => {
      const oldResult = await oldQueries.getAllChapters();
      const newResult = await newQueries.getAllChapters();
      compareResults(oldResult, newResult, 'getAllChapters');
    });
    
    it('getChapterById should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getChapterById(testData.chapter1.id);
      const newResult = await newQueries.getChapterById(testData.chapter1.id);
      compareResults(oldResult, newResult, 'getChapterById');
    });
    
    it('getActiveCollegiateChapters should return identical results', async () => {
      const oldResult = await oldQueries.getActiveCollegiateChapters();
      const newResult = await newQueries.getActiveCollegiateChapters();
      compareResults(oldResult, newResult, 'getActiveCollegiateChapters');
    });
  });
  
  describe('Seller Queries', () => {
    it('getSellerById should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getSellerById(testData.seller1.id);
      const newResult = await newQueries.getSellerById(testData.seller1.id);
      compareResults(oldResult, newResult, 'getSellerById');
    });
    
    it('getSellerByEmail should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getSellerByEmail(testData.seller1.email);
      const newResult = await newQueries.getSellerByEmail(testData.seller1.email);
      compareResults(oldResult, newResult, 'getSellerByEmail');
    });
    
    it('getPendingSellers should return identical results', async () => {
      const oldResult = await oldQueries.getPendingSellers();
      const newResult = await newQueries.getPendingSellers();
      compareResults(oldResult, newResult, 'getPendingSellers');
    });
  });
  
  describe('Product Queries', () => {
    it('getProductById should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getProductById(testData.product1.id);
      const newResult = await newQueries.getProductById(testData.product1.id);
      // Note: Product queries include nested attributes and images
      // Compare main product fields
      expect(oldResult).not.toBeNull();
      expect(newResult).not.toBeNull();
      if (oldResult && newResult) {
        expect(newResult.id).toBe(oldResult.id);
        expect(newResult.name).toBe(oldResult.name);
        expect(newResult.price_cents).toBe(oldResult.price_cents);
        expect(newResult.seller_id).toBe(oldResult.seller_id);
      }
    });
    
    it('getActiveProducts should return identical structure', async () => {
      const oldResult = await oldQueries.getActiveProducts();
      const newResult = await newQueries.getActiveProducts();
      expect(newResult.length).toBe(oldResult.length);
      if (oldResult.length > 0 && newResult.length > 0) {
        expect(newResult[0].id).toBe(oldResult[0].id);
        expect(newResult[0].name).toBe(oldResult[0].name);
      }
    });
  });
  
  describe('User Queries', () => {
    it('getUserById should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getUserById(testData.user1.id);
      const newResult = await newQueries.getUserById(testData.user1.id);
      compareResults(oldResult, newResult, 'getUserById');
    });
    
    it('getUserByCognitoSub should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getUserByCognitoSub(testData.user1.cognito_sub);
      const newResult = await newQueries.getUserByCognitoSub(testData.user1.cognito_sub);
      compareResults(oldResult, newResult, 'getUserByCognitoSub');
    });
    
    it('getUserByEmail should return identical results', async () => {
      const testData = getTestData();
      const oldResult = await oldQueries.getUserByEmail(testData.user1.email);
      const newResult = await newQueries.getUserByEmail(testData.user1.email);
      compareResults(oldResult, newResult, 'getUserByEmail');
    });
  });
  
  describe('Order Queries', () => {
    it('getOrderByStripeSessionId should return identical results', async () => {
      const testData = getTestData();
      // Create order with stripe_session_id
      const order = await oldQueries.createOrder({
        product_id: testData.product1.id,
        user_id: testData.user1.id,
        amount_cents: 5000,
        stripe_session_id: 'test-session-123'
      });
      
      const oldResult = await oldQueries.getOrderByStripeSessionId('test-session-123');
      const newResult = await newQueries.getOrderByStripeSessionId('test-session-123');
      expect(newResult?.id).toBe(oldResult?.id);
      expect(newResult?.stripe_session_id).toBe(oldResult?.stripe_session_id);
    });
  });
  
  describe('Address Queries', () => {
    it('getUserAddresses should return identical results', async () => {
      const testData = getTestData();
      // Create test address
      await oldAddressQueries.createUserAddress({
        user_id: testData.user1.id,
        street: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zip: '12345'
      });
      
      const oldResult = await oldAddressQueries.getUserAddresses(testData.user1.id);
      const newResult = await newAddressQueries.getUserAddresses(testData.user1.id);
      compareResults(oldResult, newResult, 'getUserAddresses');
    });
  });
  
  describe('Notification Queries', () => {
    it('createNotification should create identical records', async () => {
      const testData = getTestData();
      const notification = {
        user_email: testData.user1.email,
        type: 'ORDER_CONFIRMED' as const,
        title: 'Test Notification',
        message: 'Test message'
      };
      
      const oldResult = await oldNotificationQueries.createNotification(notification);
      // Clean up old result
      await oldNotificationQueries.deleteNotification(oldResult.id, testData.user1.email);
      
      const newResult = await newNotificationQueries.createNotification(notification);
      expect(newResult.user_email).toBe(notification.user_email);
      expect(newResult.type).toBe(notification.type);
      expect(newResult.title).toBe(notification.title);
      
      // Clean up
      await newNotificationQueries.deleteNotification(newResult.id, testData.user1.email);
    });
  });
  
  describe('Industry and Profession Queries', () => {
    it('getAllIndustries should return identical results', async () => {
      const oldResult = await oldQueries.getAllIndustries();
      const newResult = await newQueries.getAllIndustries();
      compareResults(oldResult, newResult, 'getAllIndustries');
    });
    
    it('getAllProfessions should return identical results', async () => {
      const oldResult = await oldQueries.getAllProfessions();
      const newResult = await newQueries.getAllProfessions();
      compareResults(oldResult, newResult, 'getAllProfessions');
    });
  });
  
  describe('Platform Settings Queries', () => {
    it('getPlatformSetting should return identical results', async () => {
      // Set a test setting first
      await oldQueries.setPlatformSetting('test_key', 'test_value', 'Test description');
      
      const oldResult = await oldQueries.getPlatformSetting('test_key');
      const newResult = await newQueries.getPlatformSetting('test_key');
      compareResults(oldResult, newResult, 'getPlatformSetting');
    });
  });
});
*/
