import request from 'supertest';
import express from 'express';
import { authService } from '../src/services/auth.service';

// Mock the auth service
jest.mock('../src/services/auth.service');

describe('Auth Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Import routes after mocking
    const authRoutes = require('../src/routes/auth.routes').default;
    app.use('/api/auth', authRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/send-otp', () => {
    it('should send OTP successfully with valid email', async () => {
      const mockSendOTP = authService.sendOTP as jest.Mock;
      mockSendOTP.mockResolvedValue({
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
      expect(mockSendOTP).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle service errors', async () => {
      const mockSendOTP = authService.sendOTP as jest.Mock;
      mockSendOTP.mockResolvedValue({
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
    it('should verify OTP and return JWT token', async () => {
      const mockVerifyOTP = authService.verifyOTP as jest.Mock;
      mockVerifyOTP.mockResolvedValue({
        success: true,
        message: 'OTP verified successfully',
        userId: 'user123',
      });

      const mockGenerateToken = authService.generateToken as jest.Mock;
      mockGenerateToken.mockReturnValue('jwt-token-123');

      const mockGetUserProfile = authService.getUserProfile as jest.Mock;
      mockGetUserProfile.mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        createdAt: new Date(),
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
        token: 'jwt-token-123',
        user: expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
        }),
        expiresIn: expect.any(String),
      });
    });

    it('should return 401 for invalid OTP', async () => {
      const mockVerifyOTP = authService.verifyOTP as jest.Mock;
      mockVerifyOTP.mockResolvedValue({
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

    it('should validate OTP format', async () => {
      const response = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'test@example.com',
          otp: '12345', // Invalid length
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockLogout = authService.logout as jest.Mock;
      mockLogout.mockResolvedValue(undefined);

      const mockVerifyToken = authService.verifyToken as jest.Mock;
      mockVerifyToken.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const mockVerifyToken = authService.verifyToken as jest.Mock;
      mockVerifyToken.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
      });

      const mockGetUserProfile = authService.getUserProfile as jest.Mock;
      mockGetUserProfile.mockResolvedValue({
        userId: 'user123',
        email: 'test@example.com',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15'),
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        user: expect.objectContaining({
          userId: 'user123',
          email: 'test@example.com',
        }),
      });
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'No token provided',
      });
    });
  });
});

describe('BigQuery Service', () => {
  const { bigqueryService } = require('../src/services/bigquery.service');

  describe('insertSurveyData', () => {
    it('should insert survey data successfully', async () => {
      const testData = [
        {
          patientId: 'patient123',
          eventName: 'initial_survey',
          timestamp: new Date(),
          responses: { q1: 'yes', q2: 'no' },
          metadata: { source: 'web' },
        },
      ];

      await expect(bigqueryService.insertSurveyData(testData)).resolves.not.toThrow();
    });
  });

  describe('getAnalytics', () => {
    it('should retrieve analytics data', async () => {
      const analytics = await bigqueryService.getAnalytics('week');
      
      expect(analytics).toHaveProperty('totalPatients');
      expect(analytics).toHaveProperty('totalEvents');
      expect(analytics).toHaveProperty('eventDistribution');
      expect(analytics).toHaveProperty('patientActivity');
      expect(analytics).toHaveProperty('completionRates');
    });
  });

  describe('getPatientJourney', () => {
    it('should retrieve patient journey data', async () => {
      const journey = await bigqueryService.getPatientJourney('patient123');
      
      expect(journey).toHaveProperty('patientId', 'patient123');
      expect(journey).toHaveProperty('events');
      expect(journey).toHaveProperty('metrics');
      expect(journey.metrics).toHaveProperty('totalEvents');
      expect(journey.metrics).toHaveProperty('completionRate');
      expect(journey.metrics).toHaveProperty('engagementScore');
    });
  });
});
