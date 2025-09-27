import React from 'react';
import { renderWithProviders, screen, fireEvent, waitFor, mockApiResponses } from '../../utils/test-utils';
import Login from './Login';
import * as authAPI from '../../services/api/authAPI';

// Mock the auth API
jest.mock('../../services/api/authAPI');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Input Phase', () => {
    it('should render email input form initially', () => {
      renderWithProviders(<Login />);

      expect(screen.getByText('PROgress Tracker')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send otp/i });

      // Try invalid email
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should send OTP for valid email', async () => {
      (authAPI.authAPI.sendOTP as jest.Mock).mockResolvedValue({
        data: mockApiResponses.sendOTP,
      });

      const { store } = renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send otp/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.authAPI.sendOTP).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show loading state while sending OTP', async () => {
      (authAPI.authAPI.sendOTP as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockApiResponses.sendOTP }), 100))
      );

      renderWithProviders(<Login />);

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send otp/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should display error message on failed OTP send', async () => {
      (authAPI.authAPI.sendOTP as jest.Mock).mockRejectedValue(
        new Error('Failed to send OTP')
      );

      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: false,
          },
        },
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send otp/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('OTP Verification Phase', () => {
    beforeEach(() => {
      (authAPI.authAPI.sendOTP as jest.Mock).mockResolvedValue({
        data: mockApiResponses.sendOTP,
      });
    });

    it('should show OTP input after email submission', async () => {
      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      // Simulate OTP sent state
      await waitFor(() => {
        expect(screen.getByLabelText(/enter otp/i)).toBeInTheDocument();
      });
    });

    it('should validate OTP format (6 digits)', async () => {
      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      const otpInput = screen.getByLabelText(/enter otp/i);
      const verifyButton = screen.getByRole('button', { name: /verify & login/i });

      // Try invalid OTP (less than 6 digits)
      fireEvent.change(otpInput, { target: { value: '12345' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/otp must be 6 digits/i)).toBeInTheDocument();
      });
    });

    it('should verify OTP and redirect on success', async () => {
      (authAPI.authAPI.verifyOTP as jest.Mock).mockResolvedValue({
        data: mockApiResponses.verifyOTP,
      });

      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      const otpInput = screen.getByLabelText(/enter otp/i);
      const verifyButton = screen.getByRole('button', { name: /verify & login/i });

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(authAPI.authAPI.verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
      });
    });

    it('should show resend OTP button with countdown', async () => {
      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      const resendButton = screen.getByRole('button', { name: /resend/i });
      
      // Initially should show countdown
      expect(resendButton).toHaveTextContent(/resend in/i);
      expect(resendButton).toBeDisabled();

      // Wait for countdown to finish (mock timer)
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(resendButton).toHaveTextContent(/resend otp/i);
        expect(resendButton).not.toBeDisabled();
      });
    });

    it('should allow changing email', async () => {
      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      const changeEmailButton = screen.getByRole('button', { name: /change email/i });
      fireEvent.click(changeEmailButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication State', () => {
    it('should redirect to dashboard if already authenticated', () => {
      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: true,
            user: {
              userId: 'test-123',
              email: 'test@example.com',
            },
            token: 'valid-token',
            loading: false,
            error: null,
            otpSent: false,
          },
        },
      });

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should store token in localStorage on successful login', async () => {
      const mockLocalStorage = {
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      (authAPI.authAPI.verifyOTP as jest.Mock).mockResolvedValue({
        data: mockApiResponses.verifyOTP,
      });

      renderWithProviders(<Login />, {
        preloadedState: {
          auth: {
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
            error: null,
            otpSent: true,
          },
        },
      });

      const otpInput = screen.getByLabelText(/enter otp/i);
      const verifyButton = screen.getByRole('button', { name: /verify & login/i });

      fireEvent.change(otpInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
      });
    });
  });
});
