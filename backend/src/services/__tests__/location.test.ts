import { LocationClient, SearchPlaceIndexForPositionCommand } from '@aws-sdk/client-location';

// Mock AWS SDK before importing
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-location', () => ({
  LocationClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SearchPlaceIndexForPositionCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

// Set environment variables before importing the service
process.env.AWS_LOCATION_PLACE_INDEX_NAME = 'test-place-index';
process.env.AWS_REGION = 'us-east-1';

// Import after mocking and setting env
import { reverseGeocode, type LocationResult } from '../location';

describe('Location Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    
    // Ensure env vars are set
    process.env.AWS_LOCATION_PLACE_INDEX_NAME = 'test-place-index';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('reverseGeocode', () => {
    it('should reverse geocode coordinates successfully', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: {
              AddressNumber: '123',
              Street: 'Main Street',
              Municipality: 'New York',
              Region: 'NY',
              Country: 'USA',
              PostalCode: '10001',
            },
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.address).toBe('123 Main Street');
      expect(result?.city).toBe('New York');
      expect(result?.state).toBe('NY');
      expect(result?.country).toBe('USA');
      expect(result?.postalCode).toBe('10001');
      expect(result?.location).toBe('New York, NY');
      expect(result?.formattedAddress).toContain('123 Main Street');
      expect(result?.coordinates.latitude).toBe(latitude);
      expect(result?.coordinates.longitude).toBe(longitude);

      expect(mockSend).toHaveBeenCalled();
      const command = (SearchPlaceIndexForPositionCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(command.IndexName).toBe('test-place-index');
      expect(command.Position).toEqual([longitude, latitude]); // AWS uses [lon, lat]
      expect(command.MaxResults).toBe(1);
    });

    it('should handle missing address number', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: {
              Street: 'Main Street',
              Municipality: 'New York',
              Region: 'NY',
              Country: 'USA',
              PostalCode: '10001',
            },
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.address).toBe('Main Street');
    });

    it('should handle missing street', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: {
              Municipality: 'New York',
              Region: 'NY',
              Country: 'USA',
            },
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.address).toBe('');
      expect(result?.location).toBe('New York, NY');
    });

    it('should return null when no results found', async () => {
      const latitude = 0;
      const longitude = 0;
      const mockResponse = {
        Results: [],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).toBeNull();
    });

    it('should return null when place is missing', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: null,
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).toBeNull();
    });

    it('should throw error when PLACE_INDEX_NAME is not configured', async () => {
      delete process.env.AWS_LOCATION_PLACE_INDEX_NAME;

      await expect(reverseGeocode(40.7128, -74.0060)).rejects.toThrow(
        'AWS_LOCATION_PLACE_INDEX_NAME is not configured'
      );
    });

    it('should throw error when AWS Location API fails', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockError = new Error('AWS Location API error');

      mockSend.mockRejectedValue(mockError);

      await expect(reverseGeocode(latitude, longitude)).rejects.toThrow('AWS Location API error');
    });

    it('should handle missing optional fields', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: {
              Municipality: 'New York',
            },
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result).not.toBeNull();
      expect(result?.state).toBeNull();
      expect(result?.country).toBeNull();
      expect(result?.postalCode).toBeNull();
      expect(result?.location).toBe('New York');
    });

    it('should format address correctly with all components', async () => {
      const latitude = 40.7128;
      const longitude = -74.0060;
      const mockResponse = {
        Results: [
          {
            Place: {
              AddressNumber: '123',
              Street: 'Main Street',
              Municipality: 'New York',
              Region: 'NY',
              Country: 'USA',
              PostalCode: '10001',
            },
          },
        ],
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await reverseGeocode(latitude, longitude);

      expect(result?.formattedAddress).toContain('123 Main Street');
      expect(result?.formattedAddress).toContain('New York');
      expect(result?.formattedAddress).toContain('NY');
      expect(result?.formattedAddress).toContain('10001');
      expect(result?.formattedAddress).toContain('USA');
    });
  });
});

