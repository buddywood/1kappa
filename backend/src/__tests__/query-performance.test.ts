/**
 * Query Performance Tests
 * 
 * NOTE: These tests are skipped after migration completion.
 * They were used to validate performance during migration from raw SQL to Sequelize.
 * Old query files have been removed after successful validation.
 */

// Skipping these tests as old query files have been removed after successful migration validation
describe.skip('Query Performance Tests (Migration Validation Complete)', () => {
  it('should be skipped - migration validation complete', () => {
    expect(true).toBe(true);
  });
});

// Original test code preserved for reference but not executed
/*
import { setupTestDatabase, teardownTestDatabase, getTestData, closeDatabaseConnections } from './helpers/db-setup';
import * as newQueries from '../db/queries-sequelize';

// Helper to measure execution time
async function measureExecutionTime(fn: () => Promise<any>): Promise<{ result: any; time: number }> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const time = Number(end - start) / 1_000_000; // Convert to milliseconds
  return { result, time };
}

// Helper to compare performance
function comparePerformance(
  oldTime: number,
  newTime: number,
  testName: string,
  threshold: number = 0.2 // 20% variance allowed
): void {
  const variance = Math.abs(newTime - oldTime) / oldTime;
  const isWithinThreshold = variance <= threshold;
  
  console.log(`${testName}:`);
  console.log(`  Old: ${oldTime.toFixed(2)}ms`);
  console.log(`  New: ${newTime.toFixed(2)}ms`);
  console.log(`  Variance: ${(variance * 100).toFixed(2)}%`);
  console.log(`  Within threshold: ${isWithinThreshold}`);
  
  // Warn if performance is significantly worse, but don't fail
  if (!isWithinThreshold && newTime > oldTime) {
    console.warn(`  ⚠️  Performance regression detected for ${testName}`);
  }
  
  // We don't fail the test, just log the comparison
  // This allows us to identify regressions without blocking the migration
  expect(true).toBe(true);
}

describe('Query Performance Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase(true);
  });
  
  afterAll(async () => {
    await teardownTestDatabase();
    await closeDatabaseConnections();
  });
  
  describe('Simple Queries', () => {
    it('getAllChapters performance comparison', async () => {
      const { time: oldTime } = await measureExecutionTime(() => oldQueries.getAllChapters());
      const { time: newTime } = await measureExecutionTime(() => newQueries.getAllChapters());
      comparePerformance(oldTime, newTime, 'getAllChapters');
    });
    
    it('getChapterById performance comparison', async () => {
      const testData = getTestData();
      const { time: oldTime } = await measureExecutionTime(() => 
        oldQueries.getChapterById(testData.chapter1.id)
      );
      const { time: newTime } = await measureExecutionTime(() => 
        newQueries.getChapterById(testData.chapter1.id)
      );
      comparePerformance(oldTime, newTime, 'getChapterById');
    });
  });
  
  describe('Complex Queries with Joins', () => {
    it('getProductById performance comparison', async () => {
      const testData = getTestData();
      const { time: oldTime } = await measureExecutionTime(() => 
        oldQueries.getProductById(testData.product1.id)
      );
      const { time: newTime } = await measureExecutionTime(() => 
        newQueries.getProductById(testData.product1.id)
      );
      comparePerformance(oldTime, newTime, 'getProductById');
    });
    
    it('getActiveProducts performance comparison', async () => {
      const { time: oldTime } = await measureExecutionTime(() => oldQueries.getActiveProducts());
      const { time: newTime } = await measureExecutionTime(() => newQueries.getActiveProducts());
      comparePerformance(oldTime, newTime, 'getActiveProducts', 0.3); // Allow 30% for complex query
    });
  });
  
  describe('User Queries', () => {
    it('getUserByCognitoSub performance comparison', async () => {
      const testData = getTestData();
      const { time: oldTime } = await measureExecutionTime(() => 
        oldQueries.getUserByCognitoSub(testData.user1.cognito_sub)
      );
      const { time: newTime } = await measureExecutionTime(() => 
        newQueries.getUserByCognitoSub(testData.user1.cognito_sub)
      );
      comparePerformance(oldTime, newTime, 'getUserByCognitoSub');
    });
  });
  
  describe('Bulk Operations', () => {
    it('getAllIndustries performance comparison', async () => {
      const { time: oldTime } = await measureExecutionTime(() => oldQueries.getAllIndustries());
      const { time: newTime } = await measureExecutionTime(() => newQueries.getAllIndustries());
      comparePerformance(oldTime, newTime, 'getAllIndustries');
    });
    
    it('getAllProfessions performance comparison', async () => {
      const { time: oldTime } = await measureExecutionTime(() => oldQueries.getAllProfessions());
      const { time: newTime } = await measureExecutionTime(() => newQueries.getAllProfessions());
      comparePerformance(oldTime, newTime, 'getAllProfessions');
    });
  });
});
*/
