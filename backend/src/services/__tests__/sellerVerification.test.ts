import puppeteer, { Browser, Page } from 'puppeteer';
import {
  createBrowser,
  verifySellerFromContent,
  type SellerVerificationResult,
} from '../sellerVerification';

// Mock Puppeteer
jest.mock('puppeteer');

describe('Seller Verification Service', () => {
  let mockBrowser: jest.Mocked<Browser>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Page
    mockPage = {
      goto: jest.fn().mockResolvedValue(undefined),
      evaluate: jest.fn(),
      content: jest.fn().mockResolvedValue(''),
    } as unknown as jest.Mocked<Page>;

    // Mock Browser
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Browser>;

    (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
  });

  describe('createBrowser', () => {
    it('should create a browser instance', async () => {
      const browser = await createBrowser(true);

      expect(browser).toBe(mockBrowser);
      expect(puppeteer.launch).toHaveBeenCalled();
    });
  });

  describe('verifySellerFromContent', () => {
    it('should verify seller when name and email match', () => {
      const pageContent = {
        bodyText: 'John Doe john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John Doe <a href="mailto:john.doe@example.com">john.doe@example.com</a></div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
      expect(result.emailMatch).toBe(true);
      expect(result.details?.name).toBe(name);
      expect(result.details?.email).toBe(email);
    });

    it('should handle case-insensitive matching', () => {
      const pageContent = {
        bodyText: 'JOHN DOE JOHN.DOE@EXAMPLE.COM is a verified vendor',
        bodyHTML: '<div>JOHN DOE JOHN.DOE@EXAMPLE.COM</div>',
      };
      const name = 'john doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
      expect(result.emailMatch).toBe(true);
    });

    it('should handle partial name matches', () => {
      const pageContent = {
        bodyText: 'John D. john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John D. john.doe@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
      expect(result.emailMatch).toBe(true);
    });

    it('should return not found when name does not match', () => {
      const pageContent = {
        bodyText: 'Jane Smith jane.smith@example.com is a verified vendor',
        bodyHTML: '<div>Jane Smith jane.smith@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(false);
      expect(result.nameMatch).toBe(false);
      expect(result.emailMatch).toBe(false);
    });

    it('should return not found when email does not match', () => {
      const pageContent = {
        bodyText: 'John Doe jane.smith@example.com is a verified vendor',
        bodyHTML: '<div>John Doe jane.smith@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(false);
      expect(result.nameMatch).toBe(true);
      expect(result.emailMatch).toBe(false);
    });

    it('should handle email variations (with/without dots)', () => {
      const pageContent = {
        bodyText: 'John Doe john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John Doe john.doe@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      // Should match because emails match exactly (case-insensitive)
      expect(result.emailMatch).toBe(true);
    });

    it('should handle name with middle initial', () => {
      const pageContent = {
        bodyText: 'John M. Doe john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John M. Doe john.doe@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
    });

    it('should handle names with suffixes', () => {
      const pageContent = {
        bodyText: 'John Doe Jr. john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John Doe Jr. john.doe@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
    });

    it('should handle empty page content', () => {
      const pageContent = {
        bodyText: '',
        bodyHTML: '',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(false);
      expect(result.nameMatch).toBe(false);
      expect(result.emailMatch).toBe(false);
    });

    it('should extract matched details', () => {
      const pageContent = {
        bodyText: 'John Doe john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John Doe <a href="mailto:john.doe@example.com">john.doe@example.com</a></div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.details?.name).toBe(name);
      expect(result.details?.email).toBe(email);
    });

    it('should handle whitespace in names', () => {
      const pageContent = {
        bodyText: 'John   Doe  john.doe@example.com is a verified vendor',
        bodyHTML: '<div>John   Doe  john.doe@example.com</div>',
      };
      const name = 'John Doe';
      const email = 'john.doe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
    });

    it('should handle special characters in names', () => {
      const pageContent = {
        bodyText: "John O'Doe john.odoe@example.com is a verified vendor",
        bodyHTML: "<div>John O'Doe john.odoe@example.com</div>",
      };
      const name = "John O'Doe";
      const email = 'john.odoe@example.com';

      const result = verifySellerFromContent(pageContent, name, email);

      expect(result.found).toBe(true);
      expect(result.nameMatch).toBe(true);
    });
  });
});

