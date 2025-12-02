/**
 * Sequelize Integration Tests
 * 
 * Tests model associations, transactions, and error handling
 */

import { setupTestDatabase, teardownTestDatabase, getTestData, closeDatabaseConnections } from './helpers/db-setup';
import sequelize from '../db/sequelize';
import {
  Chapter,
  FraternityMember,
  Seller,
  Product,
  ProductCategory,
  User,
  Order,
  Promoter,
  Event,
  Steward,
  StewardListing
} from '../db/models';

describe('Sequelize Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase(true);
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
    await closeDatabaseConnections();
  });
  
  describe('Model Associations', () => {
    it('should load Chapter with associated FraternityMembers', async () => {
      const testData = getTestData();
      const chapter = await Chapter.findByPk(testData.chapter1.id, {
        include: [
          {
            model: FraternityMember,
            as: 'initiatedMembers'
          }
        ]
      });
      
      expect(chapter).toBeTruthy();
      expect(chapter?.name).toBe('Alpha Chapter');
    });
    
    it('should load Seller with associated FraternityMember and Chapter', async () => {
      const testData = getTestData();
      const seller = await Seller.findByPk(testData.seller1.id, {
        include: [
          {
            model: FraternityMember,
            as: 'fraternityMember'
          },
          {
            model: Chapter,
            as: 'sponsoringChapter'
          }
        ]
      });
      
      expect(seller).toBeTruthy();
      expect(seller?.fraternityMember).toBeTruthy();
      expect(seller?.sponsoringChapter).toBeTruthy();
      expect(seller?.sponsoringChapter?.name).toBe('Alpha Chapter');
    });
    
    it('should load Product with associated Seller and Category', async () => {
      const testData = getTestData();
      const product = await Product.findByPk(testData.product1.id, {
        include: [
          {
            model: Seller,
            as: 'seller'
          },
          {
            model: ProductCategory,
            as: 'category'
          }
        ]
      });
      
      expect(product).toBeTruthy();
      expect(product?.seller).toBeTruthy();
      expect(product?.category).toBeTruthy();
      expect(product?.category?.name).toBe('Apparel');
    });
    
    it('should load User with associated Seller', async () => {
      const testData = getTestData();
      const user = await User.findByPk(testData.user2.id, {
        include: [
          {
            model: Seller,
            as: 'seller'
          }
        ]
      });
      
      expect(user).toBeTruthy();
      expect(user?.seller).toBeTruthy();
      expect(user?.role).toBe('SELLER');
    });
  });
  
  describe('Transactions', () => {
    it('should rollback transaction on error', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        const testData = getTestData();
        await Product.create({
          seller_id: testData.seller1.id,
          name: 'Transaction Test Product',
          description: 'Test',
          price_cents: 1000
        }, { transaction });
        
        // Intentionally cause an error
        await Product.create({
          seller_id: 99999, // Invalid seller_id
          name: 'Invalid Product',
          description: 'Test',
          price_cents: 1000
        }, { transaction });
        
        await transaction.commit();
        fail('Should have thrown an error');
      } catch (error) {
        await transaction.rollback();
        
        // Verify product was not created
        const product = await Product.findOne({
          where: { name: 'Transaction Test Product' }
        });
        expect(product).toBeNull();
      }
    });
    
    it('should commit transaction on success', async () => {
      const transaction = await sequelize.transaction();
      
      try {
        const testData = getTestData();
        const product = await Product.create({
          seller_id: testData.seller1.id,
          name: 'Committed Product',
          description: 'Test',
          price_cents: 2000
        }, { transaction });
        
        await transaction.commit();
        
        // Verify product was created
        const created = await Product.findByPk(product.id);
        expect(created).toBeTruthy();
        expect(created?.name).toBe('Committed Product');
        
        // Clean up
        await Product.destroy({ where: { id: product.id } });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle not found errors gracefully', async () => {
      const product = await Product.findByPk(99999);
      expect(product).toBeNull();
    });
    
    it('should handle unique constraint violations', async () => {
      const testData = getTestData();
      
      try {
        await Seller.create({
          email: testData.seller1.email, // Duplicate email
          name: 'Duplicate Seller',
          sponsoring_chapter_id: testData.chapter1.id,
          kappa_vendor_id: 'DUPLICATE'
        });
        fail('Should have thrown a unique constraint error');
      } catch (error: any) {
        expect(error.name).toBe('SequelizeUniqueConstraintError');
      }
    });
    
    it('should handle foreign key constraint violations', async () => {
      try {
        await Product.create({
          seller_id: 99999, // Invalid seller_id
          name: 'Invalid Product',
          description: 'Test',
          price_cents: 1000
        });
        fail('Should have thrown a foreign key constraint error');
      } catch (error: any) {
        expect(error.name).toBe('SequelizeForeignKeyConstraintError');
      }
    });
  });
  
  describe('JSONB Field Handling', () => {
    it('should properly handle JSONB social_links field', async () => {
      const testData = getTestData();
      const seller = await Seller.findByPk(testData.seller1.id);
      
      expect(seller).toBeTruthy();
      expect(seller?.social_links).toBeDefined();
      expect(typeof seller?.social_links).toBe('object');
    });
    
    it('should properly save and retrieve JSONB fields', async () => {
      const testData = getTestData();
      const seller = await Seller.findByPk(testData.seller1.id);
      
      if (seller) {
        seller.social_links = {
          twitter: 'https://twitter.com/test',
          linkedin: 'https://linkedin.com/in/test'
        };
        await seller.save();
        
        const updated = await Seller.findByPk(testData.seller1.id);
        expect(updated?.social_links).toEqual({
          twitter: 'https://twitter.com/test',
          linkedin: 'https://linkedin.com/in/test'
        });
      }
    });
  });
  
  describe('Eager Loading', () => {
    it('should eager load nested associations', async () => {
      const testData = getTestData();
      const product = await Product.findByPk(testData.product1.id, {
        include: [
          {
            model: Seller,
            as: 'seller',
            include: [
              {
                model: FraternityMember,
                as: 'fraternityMember',
                include: [
                  {
                    model: Chapter,
                    as: 'initiatedChapter'
                  }
                ]
              }
            ]
          }
        ]
      });
      
      expect(product).toBeTruthy();
      expect(product?.seller).toBeTruthy();
      expect(product?.seller?.fraternityMember).toBeTruthy();
      expect(product?.seller?.fraternityMember?.initiatedChapter).toBeTruthy();
    });
  });
});



