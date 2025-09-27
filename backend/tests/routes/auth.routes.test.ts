import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/auth.routes';
import { authService } from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP successfully', async () => {
      (authService.sendOTP as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'OTP sent successfully',
      });

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: expect.any(String),
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle service errors', async () => {
      (authService.sendOTP as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Email service unavailable',
      });

      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Email service unavailable',
      });
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP and return token', async () => {
      (authService.verifyOTP as jest.Mock).mockResolvedValueOnce({
        success: true,
        message: 'OTP verified',
        userId: 'test-user-id',
      });

      (authService.generateToken as jest.Mock).mockReturnValueOnce('test-jwt-token');

      (authService.getUserProfile as jest.Mock).mockResolvedValueOnce({
        userId: 'test-user-id',
        email: 'test@example.com',
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '123456',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Authentication successful',
        token: 'test-jwt-token',
        user: expect.any(Object),
        expiresIn: expect.any(String),
      });
    });

    it('should validate OTP format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '12345', // Invalid: should be 6 digits
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle invalid OTP', async () => {
      (authService.verifyOTP as jest.Mock).mockResolvedValueOnce({
        success: false,
        message: 'Invalid or expired OTP',
      });

      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '000000',
        })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid or expired OTP',
      });
    });
  });
});
