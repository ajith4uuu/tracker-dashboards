import axios, { AxiosError } from 'axios';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';
import { redisClient } from './redis.service';

interface OTPResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface UserProfile {
  userId: string;
  email: string;
  createdAt?: Date;
  lastLogin?: Date;
  metadata?: Record<string, any>;
}

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

class AuthService {
  private emailServiceUrl: string;
  private jwtSecret: Secret;
  private jwtExpiresIn: string | number;
  private localCache: NodeCache;
  private emailServiceTimeout: number;

  constructor() {
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'https://email-backend-1062713216421.northamerica-northeast2.run.app';
    this.jwtSecret = (process.env.JWT_SECRET || 'default-secret-change-in-production') as Secret;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.emailServiceTimeout = parseInt(process.env.EMAIL_SERVICE_TIMEOUT || '30000', 10);
    
    // Local cache for user sessions (fallback if Redis not available)
    this.localCache = new NodeCache({ 
      stdTTL: 3600, 
      checkperiod: 600 
    });
  }

  /**
   * Send OTP to email using external email service
   */
  async sendOTP(email: string): Promise<OTPResponse> {
    try {
      logger.info(`Sending OTP request to external service for: ${email}`);

      const response = await axios.post(
        `${this.emailServiceUrl}/send-otp`,
        { email },
        {
          timeout: this.emailServiceTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Store OTP session in cache
        const sessionData = {
          email,
          timestamp: new Date(),
          attempts: 0,
        };

        await this.setCache(`otp_session_${email}`, sessionData, 600);

        return {
          success: true,
          message: response.data.message || 'OTP sent successfully',
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to send OTP',
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        logger.error('Email service responded with error:', {
          status: axiosError.response.status,
          data: axiosError.response.data,
        });
        
        return {
          success: false,
          message: 'Email service error. Please try again.',
        };
      } else if (axiosError.request) {
        logger.error('No response from email service:', axiosError.message);
        return {
          success: false,
          message: 'Email service unavailable. Please try again later.',
        };
      } else {
        logger.error('Error setting up email request:', axiosError.message);
        return {
          success: false,
          message: 'Failed to process request. Please try again.',
        };
      }
    }
  }

  /**
   * Verify OTP using external email service
   */
  async verifyOTP(email: string, otp: string): Promise<OTPResponse & { userId?: string }> {
    try {
      logger.info(`Verifying OTP for: ${email}`);

      // Check session exists
      const session = await this.getCache(`otp_session_${email}`);
      if (!session) {
        return {
          success: false,
          message: 'OTP session expired. Please request a new OTP.',
        };
      }

      // Check max attempts
      if (session.attempts >= 5) {
        await this.deleteCache(`otp_session_${email}`);
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP.',
        };
      }

      // Update attempts
      session.attempts += 1;
      await this.setCache(`otp_session_${email}`, session, 600);

      // Verify with external service
      const response = await axios.post(
        `${this.emailServiceUrl}/verify-otp`,
        { email, otp },
        {
          timeout: this.emailServiceTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Clear OTP session
        await this.deleteCache(`otp_session_${email}`);

        // Create or get user
        let userId = await this.getCache(`user_${email}`);
        if (!userId) {
          userId = uuidv4();
          await this.setCache(`user_${email}`, userId, 86400 * 30); // 30 days
        }

        // Store user session
        const userSession = {
          userId,
          email,
          lastLogin: new Date(),
          active: true,
        };
        await this.setCache(`session_${userId}`, userSession, 86400);

        return {
          success: true,
          message: 'OTP verified successfully',
          userId,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Invalid OTP',
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid or expired OTP',
        };
      }

      logger.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: { email: string; userId: string }): string {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
    };
    const options: SignOptions = { expiresIn: this.jwtExpiresIn as any };
    return jwt.sign(tokenPayload, this.jwtSecret, options);
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(email: string): Promise<UserProfile> {
    const userId = await this.getCache(`user_${email}`) || uuidv4();
    const session = await this.getCache(`session_${userId}`);

    return {
      userId,
      email,
      createdAt: session?.createdAt || new Date(),
      lastLogin: session?.lastLogin || new Date(),
      metadata: session?.metadata || {},
    };
  }

  /**
   * Logout user
   */
  async logout(email: string): Promise<void> {
    const userId = await this.getCache(`user_${email}`);
    if (userId) {
      await this.deleteCache(`session_${userId}`);
    }
  }

  /**
   * Cache operations with Redis fallback to local cache
   */
  private async setCache(key: string, value: any, ttl: number): Promise<void> {
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        this.localCache.set(key, value, ttl);
      }
    } catch (error) {
      logger.warn('Cache set failed, using local cache:', error);
      this.localCache.set(key, value, ttl);
    }
  }

  private async getCache(key: string): Promise<any> {
    try {
      if (redisClient && redisClient.isOpen) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        return this.localCache.get(key);
      }
    } catch (error) {
      logger.warn('Cache get failed, using local cache:', error);
      return this.localCache.get(key);
    }
  }

  private async deleteCache(key: string): Promise<void> {
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(key);
      } else {
        this.localCache.del(key);
      }
    } catch (error) {
      logger.warn('Cache delete failed, using local cache:', error);
      this.localCache.del(key);
    }
  }
}

export const authService = new AuthService();
