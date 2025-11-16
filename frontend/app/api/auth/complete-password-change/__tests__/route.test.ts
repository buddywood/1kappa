import { POST } from '../route';
import { NextRequest } from 'next/server';
import { completeNewPasswordChallenge } from '@/lib/cognito';

// Mock the cognito library
jest.mock('@/lib/cognito', () => ({
  completeNewPasswordChallenge: jest.fn(),
}));

describe('/api/auth/complete-password-change', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return success when password change succeeds', async () => {
      const mockResult = {
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        userSub: 'mock-user-sub',
        email: 'test@example.com',
      };

      (completeNewPasswordChallenge as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'NewPassword123!',
          userAttributes: {
            email: 'test@example.com',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockResult);
      expect(completeNewPasswordChallenge).toHaveBeenCalledWith(
        'NewPassword123!',
        { email: 'test@example.com' }
      );
    });

    it('should return error when newPassword is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({
          userAttributes: {
            email: 'test@example.com',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('New password is required');
      expect(completeNewPasswordChallenge).not.toHaveBeenCalled();
    });

    it('should handle password change failure', async () => {
      const mockError = {
        message: 'Password does not meet requirements',
        code: 'InvalidPasswordException',
        name: 'InvalidPasswordException',
      };

      (completeNewPasswordChallenge as jest.Mock).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'weak',
          userAttributes: {
            email: 'test@example.com',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Password does not meet requirements');
      expect(data.code).toBe('InvalidPasswordException');
      expect(data.name).toBe('InvalidPasswordException');
    });

    it('should handle password change with optional userAttributes', async () => {
      const mockResult = {
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        userSub: 'mock-user-sub',
        email: 'test@example.com',
      };

      (completeNewPasswordChallenge as jest.Mock).mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'NewPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(completeNewPasswordChallenge).toHaveBeenCalledWith('NewPassword123!', undefined);
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      const mockError = {
        message: 'Network error',
        code: 'NetworkError',
        name: 'Error',
      };

      (completeNewPasswordChallenge as jest.Mock).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'NewPassword123!',
          userAttributes: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Network error');
    });
  });
});

