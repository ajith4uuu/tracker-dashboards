import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.1'],              // Error rate should be below 10%
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@example.com';

// Helper function to generate random email
function randomEmail() {
  return `test${Math.floor(Math.random() * 100000)}@example.com`;
}

// Test scenarios
export default function () {
  // Scenario 1: Health Check
  healthCheckTest();
  sleep(1);

  // Scenario 2: Authentication Flow
  authenticationFlowTest();
  sleep(2);

  // Scenario 3: Dashboard Analytics
  dashboardTest();
  sleep(2);

  // Scenario 4: Patient List
  patientListTest();
  sleep(2);
}

function healthCheckTest() {
  const response = http.get(`${BASE_URL}/health`);
  
  const result = check(response, {
    'Health check status is 200': (r) => r.status === 200,
    'Health check response time < 100ms': (r) => r.timings.duration < 100,
    'Health check returns status': (r) => JSON.parse(r.body).status === 'healthy',
  });
  
  errorRate.add(!result);
}

function authenticationFlowTest() {
  const email = randomEmail();
  
  // Step 1: Send OTP
  const sendOtpPayload = JSON.stringify({ email });
  const sendOtpParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const sendOtpResponse = http.post(
    `${BASE_URL}/api/auth/send-otp`,
    sendOtpPayload,
    sendOtpParams
  );
  
  const sendOtpResult = check(sendOtpResponse, {
    'Send OTP status is 200': (r) => r.status === 200,
    'Send OTP returns success': (r) => JSON.parse(r.body).success === true,
  });
  
  errorRate.add(!sendOtpResult);
  
  // Note: In real testing, you would need to retrieve the actual OTP
  // For load testing, we'll skip the verify step or use a test endpoint
}

function dashboardTest() {
  // Note: In real testing, you would use a valid JWT token
  const token = 'test-token';
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(
    `${BASE_URL}/api/analytics/dashboard?timeRange=week`,
    params
  );
  
  const result = check(response, {
    'Dashboard status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'Dashboard response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!result && response.status !== 401);
}

function patientListTest() {
  const token = 'test-token';
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(
    `${BASE_URL}/api/patients?page=1&limit=20`,
    params
  );
  
  const result = check(response, {
    'Patient list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    'Patient list response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!result && response.status !== 401);
}

// Stress test scenario
export function stressTest() {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'Status is 200': (r) => r.status === 200,
  });
}

// Spike test scenario
export function spikeTest() {
  const response = http.get(`${BASE_URL}/health`);
  check(response, {
    'Status is 200': (r) => r.status === 200,
  });
}

// Soak test scenario
export function soakTest() {
  healthCheckTest();
  sleep(5);
  dashboardTest();
  sleep(5);
}
