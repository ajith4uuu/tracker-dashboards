import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/auth.routes';
import { authService } from '../src/services/auth.service';

// Mock the auth service
jest.mock('../src/services/auth.service');

describe('Auth Routes Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    jest.clearAllMocks();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP successfully with valid email', async () => {
      const mockEmail = 'test@example.com';
      
      (authService.sendOTP as jest.Mock).mockResolvedValue({
        success: true,
        message: 'OTP sent successfully',
      });

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: mockEmail })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: process.env.OTP_EXPIRES_IN || '600000',
      });

      expect(authService.sendOTP).toHaveBeenCalledWith(mockEmail);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when OTP sending fails', async () => {
      (authService.sendOTP as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Failed to send OTP',
      });

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to send OTP',
      });
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP and return token', async () => {
      const mockEmail = 'test@example.com';
      const mockOTP = '123456';
      const mockUserId = 'user-123';
      const mockToken = 'jwt-token';
      const mockUserProfile = {
        userId: mockUserId,
        email: mockEmail,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      (authService.verifyOTP as jest.Mock).mockResolvedValue({
        success: true,
        message: 'OTP verified',
        userId: mockUserId,
      });

      (authService.generateToken as jest.Mock).mockReturnValue(mockToken);
      (authService.getUserProfile as jest.Mock).mockResolvedValue(mockUserProfile);

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: mockEmail, otp: mockOTP })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Authentication successful',
        token: mockToken,
        user: expect.any(Object),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });

      expect(authService.verifyOTP).toHaveBeenCalledWith(mockEmail, mockOTP);
      expect(authService.generateToken).toHaveBeenCalledWith({
        email: mockEmail,
        userId: mockUserId,
      });
    });

    it('should return 401 for invalid OTP', async () => {
      (authService.verifyOTP as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Invalid OTP',
      });

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '999999' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid OTP',
      });
    });

    it('should validate OTP format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '12345' }) // Only 5 digits
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token for authenticated user', async () => {
      const mockUser = {
        email: 'test@example.com',
        userId: 'user-123',
      };
      const newToken = 'new-jwt-token';

      // Mock auth middleware
      app.use((req, res, next) => {
        (req as any).user = mockUser;
        next();
      });

      (authService.generateToken as jest.Mock).mockReturnValue(newToken);

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer old-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockUser = {
        email: 'test@example.com',
        userId: 'user-123',
      };

      // Mock auth middleware
      app.use((req, res, next) => {
        (req as any).user = mockUser;
        next();
      });

      (authService.logout as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully',
      });

      expect(authService.logout).toHaveBeenCalledWith(mockUser.email);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const mockUser = {
        email: 'test@example.com',
        userId: 'user-123',
      };
      const mockProfile = {
        ...mockUser,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // Mock auth middleware
      app.use((req, res, next) => {
        (req as any).user = mockUser;
        next();
      });

      (authService.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: expect.any(Object),
      });

      expect(authService.getUserProfile).toHaveBeenCalledWith(mockUser.email);
    });
  });
});
