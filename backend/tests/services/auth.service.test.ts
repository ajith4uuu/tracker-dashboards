import { authService } from '../../src/services/auth.service';
import axios from 'axios';
import jwt from 'jsonwebtoken';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendOTP', () => {
    it('should successfully send OTP', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OTP sent successfully',
        },
      });

      const result = await authService.sendOTP('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/send-otp'),
        { email: 'test@example.com' },
        expect.any(Object)
      );
    });

    it('should handle email service errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Email service error' },
        },
      });

      const result = await authService.sendOTP('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email service error. Please try again.');
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify OTP', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'OTP verified successfully',
        },
      });

      const result = await authService.verifyOTP('test@example.com', '123456');

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP verified successfully');
    });

    it('should handle invalid OTP', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid OTP' },
        },
      });

      const result = await authService.verifyOTP('test@example.com', '000000');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired OTP');
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
      };

      const token = authService.generateToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token structure
      const decoded = jwt.decode(token) as any;
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
      };

      const token = authService.generateToken(payload);
      const verified = authService.verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.email).toBe(payload.email);
    });

    it('should return null for invalid token', () => {
      const verified = authService.verifyToken('invalid-token');
      expect(verified).toBeNull();
    });
  });
});
