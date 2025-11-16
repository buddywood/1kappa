import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  sendWelcomeEmail,
  sendSellerApplicationSubmittedEmail,
  sendSellerApprovedEmail,
} from '../email';

// Mock AWS SDK
jest.mock('@aws-sdk/client-ses');

describe('Email Service', () => {
  const mockSend = jest.fn();
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    
    // Mock SESClient
    (SESClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    // Set required environment variables
    process.env.FROM_EMAIL = 'noreply@1kappa.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendWelcomeEmail(email, name);

      expect(mockSend).toHaveBeenCalledWith(expect.any(SendEmailCommand));
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Source).toBe('noreply@1kappa.com');
      expect(command.input.Destination.ToAddresses).toEqual([email]);
      expect(command.input.Message.Subject.Data).toBe('Welcome to 1Kappa!');
      expect(command.input.Message.Body.Html.Data).toContain(name);
      expect(command.input.Message.Body.Html.Data).toContain('Welcome to 1Kappa');
      expect(command.input.Message.Body.Text.Data).toContain(name);
    });

    it('should throw error when email sending fails', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      await expect(sendWelcomeEmail(email, name)).rejects.toThrow('SES error');
    });

    it('should include logo URL in email HTML', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendWelcomeEmail(email, name);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message.Body.Html.Data).toContain('http://localhost:3000/horizon-logo.png');
    });
  });

  describe('sendSellerApplicationSubmittedEmail', () => {
    it('should send seller application submitted email successfully', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApplicationSubmittedEmail(email, name);

      expect(mockSend).toHaveBeenCalledWith(expect.any(SendEmailCommand));
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Source).toBe('noreply@1kappa.com');
      expect(command.input.Destination.ToAddresses).toEqual([email]);
      expect(command.input.Message.Subject.Data).toBe('Seller Application Received - 1Kappa');
      expect(command.input.Message.Body.Html.Data).toContain(name);
      expect(command.input.Message.Body.Html.Data).toContain('Application Received');
      expect(command.input.Message.Body.Text.Data).toContain(name);
    });

    it('should not throw error when email sending fails', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      // Should not throw - email failure shouldn't break application submission
      await expect(sendSellerApplicationSubmittedEmail(email, name)).resolves.not.toThrow();
    });
  });

  describe('sendSellerApprovedEmail', () => {
    it('should send seller approved email with invitation token', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const invitationToken = 'invitation-token-123';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApprovedEmail(email, name, invitationToken);

      expect(mockSend).toHaveBeenCalledWith(expect.any(SendEmailCommand));
      const command = mockSend.mock.calls[0][0];
      expect(command.input.Source).toBe('noreply@1kappa.com');
      expect(command.input.Destination.ToAddresses).toEqual([email]);
      expect(command.input.Message.Subject.Data).toBe('Congratulations! Your Seller Application Has Been Approved - 1Kappa');
      expect(command.input.Message.Body.Html.Data).toContain(name);
      expect(command.input.Message.Body.Html.Data).toContain('Application Approved');
      expect(command.input.Message.Body.Html.Data).toContain('invitation-token-123');
      expect(command.input.Message.Body.Html.Data).toContain('seller-setup?token=');
    });

    it('should send seller approved email without invitation token', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApprovedEmail(email, name);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.Message.Body.Html.Data).not.toContain('seller-setup?token=');
      expect(command.input.Message.Body.Html.Data).toContain('/login');
    });

    it('should not throw error when email sending fails', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      // Should not throw - email failure shouldn't break approval process
      await expect(sendSellerApprovedEmail(email, name)).resolves.not.toThrow();
    });
  });
});

