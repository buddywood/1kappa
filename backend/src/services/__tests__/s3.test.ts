import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import {
  uploadToS3,
  getPresignedUrl,
  getPresignedUploadUrl,
} from '../s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('uuid');

describe('S3 Service', () => {
  const mockSend = jest.fn();
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    
    // Mock S3Client
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    // Set required environment variables
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    // Mock uuid
    (uuidv4 as jest.Mock).mockReturnValue('test-uuid-123');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('uploadToS3', () => {
    it('should upload file to S3 successfully', async () => {
      const file = Buffer.from('test file content');
      const filename = 'test.jpg';
      const contentType = 'image/jpeg';

      mockSend.mockResolvedValue({});

      const result = await uploadToS3(file, filename, contentType);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toContain('products/test-uuid-123-test.jpg');
      expect(command.input.Body).toBe(file);
      expect(command.input.ContentType).toBe(contentType);
      expect(result.key).toContain('products/test-uuid-123-test.jpg');
      expect(result.url).toContain('test-bucket.s3.us-east-1.amazonaws.com');
    });

    it('should upload to correct folder', async () => {
      const file = Buffer.from('test file content');
      const filename = 'headshot.jpg';
      const contentType = 'image/jpeg';

      mockSend.mockResolvedValue({});

      const result = await uploadToS3(file, filename, contentType, 'headshots');

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Key).toContain('headshots/');
      expect(result.key).toContain('headshots/');
    });

    it('should handle different folder types', async () => {
      const file = Buffer.from('test file content');
      const filename = 'logo.png';
      const contentType = 'image/png';

      mockSend.mockResolvedValue({});

      const folders = ['headshots', 'products', 'store-logos', 'steward-listings'] as const;
      
      for (const folder of folders) {
        jest.clearAllMocks();
        await uploadToS3(file, filename, contentType, folder);
        const command = mockSend.mock.calls[0][0];
        expect(command.input.Key).toContain(`${folder}/`);
      }
    });

    it('should throw error when upload fails', async () => {
      const file = Buffer.from('test file content');
      const filename = 'test.jpg';
      const contentType = 'image/jpeg';
      const mockError = new Error('S3 upload failed');

      mockSend.mockRejectedValue(mockError);

      await expect(uploadToS3(file, filename, contentType)).rejects.toThrow('S3 upload failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL for reading', async () => {
      const key = 'products/test-file.jpg';
      const expiresIn = 3600;
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockPresignedUrl);

      const result = await getPresignedUrl(key, expiresIn);

      expect(result).toBe(mockPresignedUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(GetObjectCommand),
        { expiresIn }
      );
      const command = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toBe(key);
    });

    it('should use default expiration time', async () => {
      const key = 'products/test-file.jpg';
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockPresignedUrl);

      await getPresignedUrl(key);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(GetObjectCommand),
        { expiresIn: 3600 }
      );
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned URL for uploading', async () => {
      const key = 'products/test-file.jpg';
      const contentType = 'image/jpeg';
      const expiresIn = 3600;
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockPresignedUrl);

      const result = await getPresignedUploadUrl(key, contentType, expiresIn);

      expect(result).toBe(mockPresignedUrl);
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn }
      );
      const command = (getSignedUrl as jest.Mock).mock.calls[0][1];
      expect(command.input.Bucket).toBe('test-bucket');
      expect(command.input.Key).toBe(key);
      expect(command.input.ContentType).toBe(contentType);
    });

    it('should use default expiration time', async () => {
      const key = 'products/test-file.jpg';
      const contentType = 'image/jpeg';
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockPresignedUrl);

      await getPresignedUploadUrl(key, contentType);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn: 3600 }
      );
    });
  });
});

