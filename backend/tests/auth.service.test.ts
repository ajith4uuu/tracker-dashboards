import { authService } from '../src/services/auth.service';
import axios from 'axios';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('axios');
jest.mock('../src/services/redis.service');

describe('AuthService', () => {
  const mockEmail = 'test@example.com';
  const mockOTP = '123456';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.EMAIL_SERVICE_URL = 'https://email-service.com';
  });

  describe('sendOTP', () => {
    it('should successfully send OTP', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'OTP sent successfully',
        },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.sendOTP(mockEmail);

      expect(result.success).toBe(true);
      expect(result.message).toBe('OTP sent successfully');
      expect(axios.post).toHaveBeenCalledWith(
        'https://email-service.com/send-otp',
        { email: mockEmail },
        expect.any(Object)
      );
    });

    it('should handle email service error', async () => {
      (axios.post as jest.Mock).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Service error' },
        },
      });

      const result = await authService.sendOTP(mockEmail);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email service error. Please try again.');
    });

    it('should handle network error', async () => {
      (axios.post as jest.Mock).mockRejectedValue({
        request: {},
        message: 'Network error',
      });

      const result = await authService.sendOTP(mockEmail);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email service unavailable. Please try again later.');
    });
  });

  describe('verifyOTP', () => {
    it('should successfully verify OTP and return userId', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'OTP verified successfully',
        },
      };

      (axios.post as jest.Mock).mockResolvedValue(mockResponse);

      // Mock cache operations
      const mockSetCache = jest.spyOn(authService as any, 'setCache').mockResolvedValue(undefined);
      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValueOnce({ attempts: 0 }) // Session exists
        .mockResolvedValueOnce(null); // No existing userId

      const result = await authService.verifyOTP(mockEmail, mockOTP);

      expect(result.success).toBe(true);
      expect(result.userId).toBeDefined();
      expect(axios.post).toHaveBeenCalledWith(
        'https://email-service.com/verify-otp',
        { email: mockEmail, otp: mockOTP },
        expect.any(Object)
      );
    });

    it('should handle invalid OTP', async () => {
      (axios.post as jest.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Invalid OTP' },
        },
      });

      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValue({ attempts: 0 });

      const result = await authService.verifyOTP(mockEmail, mockOTP);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid or expired OTP');
    });

    it('should handle max attempts exceeded', async () => {
      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValue({ attempts: 5 });

      const result = await authService.verifyOTP(mockEmail, mockOTP);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Maximum attempts exceeded. Please request a new OTP.');
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { email: mockEmail, userId: mockUserId };
      const token = authService.generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.email).toBe(mockEmail);
      expect(decoded.userId).toBe(mockUserId);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { email: mockEmail, userId: mockUserId };
      const token = jwt.sign(payload, process.env.JWT_SECRET!);

      const result = authService.verifyToken(token);

      expect(result).not.toBeNull();
      expect(result?.email).toBe(mockEmail);
      expect(result?.userId).toBe(mockUserId);
    });

    it('should return null for invalid token', () => {
      const result = authService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null for expired token', () => {
      const token = jwt.sign(
        { email: mockEmail, userId: mockUserId },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      const result = authService.verifyToken(token);

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValueOnce(mockUserId)
        .mockResolvedValueOnce({
          createdAt: new Date('2024-01-01'),
          lastLogin: new Date('2024-01-02'),
        });

      const profile = await authService.getUserProfile(mockEmail);

      expect(profile.userId).toBe(mockUserId);
      expect(profile.email).toBe(mockEmail);
      expect(profile.createdAt).toBeDefined();
      expect(profile.lastLogin).toBeDefined();
    });

    it('should generate new userId if not exists', async () => {
      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const profile = await authService.getUserProfile(mockEmail);

      expect(profile.userId).toBeDefined();
      expect(profile.email).toBe(mockEmail);
    });
  });

  describe('logout', () => {
    it('should clear user session', async () => {
      const mockGetCache = jest.spyOn(authService as any, 'getCache')
        .mockResolvedValue(mockUserId);
      const mockDeleteCache = jest.spyOn(authService as any, 'deleteCache')
        .mockResolvedValue(undefined);

      await authService.logout(mockEmail);

      expect(mockGetCache).toHaveBeenCalledWith(`user_${mockEmail}`);
      expect(mockDeleteCache).toHaveBeenCalledWith(`session_${mockUserId}`);
    });
  });
});
