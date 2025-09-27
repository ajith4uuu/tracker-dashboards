import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
];

const validateOTP = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
];

const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// Send OTP endpoint
router.post('/send-otp', 
  validateEmail, 
  handleValidationErrors, 
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      logger.info(`Sending OTP to email: ${email}`);

      const result = await authService.sendOTP(email);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Failed to send OTP',
        });
      }

      res.json({
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: process.env.OTP_EXPIRES_IN || '600000',
      });
    } catch (error) {
      logger.error('Error in send-otp endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
});

// Verify OTP endpoint
router.post('/verify-otp',
  validateOTP,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      logger.info(`Verifying OTP for email: ${email}`);

      const result = await authService.verifyOTP(email, otp);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.message || 'Invalid or expired OTP',
        });
      }

      // Generate JWT token
      const token = authService.generateToken({ email, userId: result.userId });

      // Get user profile
      const userProfile = await authService.getUserProfile(email);

      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: userProfile,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
    } catch (error) {
      logger.error('Error in verify-otp endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP. Please try again.',
      });
    }
});

// Refresh token endpoint
router.post('/refresh-token',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const newToken = authService.generateToken({
        email: user.email,
        userId: user.userId,
      });

      res.json({
        success: true,
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      });
    } catch (error) {
      logger.error('Error in refresh-token endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
      });
    }
});

// Logout endpoint
router.post('/logout',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      // Invalidate token (add to blacklist if using Redis)
      await authService.logout(user.email);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Error in logout endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout',
      });
    }
});

// Get current user endpoint
router.get('/me',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      const userProfile = await authService.getUserProfile(user.email);

      res.json({
        success: true,
        user: userProfile,
      });
    } catch (error) {
      logger.error('Error in me endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
      });
    }
});

// Validate token endpoint
router.post('/validate',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        valid: true,
        user: (req as any).user,
      });
    } catch (error) {
      logger.error('Error in validate endpoint', error);
      res.status(500).json({
        success: false,
        message: 'Token validation failed',
      });
    }
});

export default router;
