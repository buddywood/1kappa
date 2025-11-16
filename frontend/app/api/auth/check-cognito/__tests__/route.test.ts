import { POST } from '../route';
import { NextRequest } from 'next/server';
import { signIn } from '@/lib/cognito';

// Mock the cognito library
jest.mock('@/lib/cognito', () => ({
  signIn: jest.fn(),
}));

describe('/api/auth/check-cognito', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return success when authentication succeeds', async () => {
      const mockSignInResult = {
        accessToken: 'mock-access-token',
        idToken: 'mock-id-token',
        refreshToken: 'mock-refresh-token',
        userSub: 'mock-user-sub',
        email: 'test@example.com',
      };

      (signIn as jest.Mock).mockResolvedValue(mockSignInResult);

      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockSignInResult);
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'TestPassword123!');
    });

    it('should return error when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
      expect(signIn).not.toHaveBeenCalled();
    });

    it('should return error when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and password are required');
      expect(signIn).not.toHaveBeenCalled();
    });

    it('should return error details when authentication fails', async () => {
      const mockError = {
        message: 'Incorrect username or password',
        code: 'NotAuthorizedException',
        name: 'NotAuthorizedException',
      };

      (signIn as jest.Mock).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Incorrect username or password');
      expect(data.code).toBe('NotAuthorizedException');
      expect(data.name).toBe('NotAuthorizedException');
    });

    it('should handle UserNotConfirmedException', async () => {
      const mockError = {
        message: 'User is not confirmed',
        code: 'UserNotConfirmedException',
        name: 'UserNotConfirmedException',
      };

      (signIn as jest.Mock).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.code).toBe('UserNotConfirmedException');
    });

    it('should handle NEW_PASSWORD_REQUIRED error', async () => {
      const mockError = {
        message: 'NEW_PASSWORD_REQUIRED',
        code: 'NEW_PASSWORD_REQUIRED',
        name: 'NewPasswordRequiredException',
      };

      (signIn as jest.Mock).mockRejectedValue(mockError);

      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TempPassword123!',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('NEW_PASSWORD_REQUIRED');
    });

    it('should handle invalid JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/check-cognito', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});

