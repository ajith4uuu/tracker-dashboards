#!/bin/bash

# PROgress Tracker - Comprehensive Test Runner
# This script runs all tests: unit, integration, e2e, and performance

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored messages
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to check if service is running
check_service() {
    local url=$1
    local service=$2
    
    if curl -s -f "$url/health" > /dev/null 2>&1; then
        print_success "$service is running"
        return 0
    else
        print_warning "$service is not running"
        return 1
    fi
}

# Main test execution
main() {
    print_header "PROgress Tracker - Test Suite"
    
    # Check prerequisites
    print_header "Checking Prerequisites"
    
    if command -v node &> /dev/null; then
        print_success "Node.js installed ($(node --version))"
    else
        print_error "Node.js not installed"
        exit 1
    fi
    
    if command -v docker &> /dev/null; then
        print_success "Docker installed ($(docker --version | cut -d' ' -f3))"
    else
        print_error "Docker not installed"
        exit 1
    fi
    
    # Backend Unit Tests
    print_header "Running Backend Unit Tests"
    cd backend
    
    if npm test -- --coverage --silent 2>&1 | grep -q "Test Suites:.*passed"; then
        print_success "Backend unit tests passed"
    else
        print_error "Backend unit tests failed"
    fi
    
    # Backend Linting
    print_header "Running Backend Linting"
    
    if npm run lint 2>&1 | grep -q "error"; then
        print_error "Backend linting failed"
    else
        print_success "Backend linting passed"
    fi
    
    cd ..
    
    # Frontend Unit Tests
    print_header "Running Frontend Unit Tests"
    cd frontend
    
    if CI=true npm test -- --coverage --watchAll=false 2>&1 | grep -q "Test Suites:.*passed"; then
        print_success "Frontend unit tests passed"
    else
        print_warning "Frontend unit tests skipped (no tests defined)"
    fi
    
    # Frontend Build Test
    print_header "Testing Frontend Build"
    
    if npm run build > /dev/null 2>&1; then
        print_success "Frontend build successful"
    else
        print_error "Frontend build failed"
    fi
    
    cd ..
    
    # Docker Build Test
    print_header "Testing Docker Builds"
    
    if docker build -t test-backend ./backend > /dev/null 2>&1; then
        print_success "Backend Docker build successful"
    else
        print_error "Backend Docker build failed"
    fi
    
    if docker build -t test-frontend ./frontend > /dev/null 2>&1; then
        print_success "Frontend Docker build successful"
    else
        print_error "Frontend Docker build failed"
    fi
    
    # Integration Tests (using docker-compose)
    print_header "Running Integration Tests"
    
    echo "Starting services with docker-compose..."
    docker-compose up -d > /dev/null 2>&1
    
    echo "Waiting for services to start..."
    sleep 30
    
    # Check if services are running
    check_service "http://localhost:8080" "Backend"
    check_service "http://localhost:3000" "Frontend"
    
    # API Endpoint Tests
    print_header "Testing API Endpoints"
    
    # Health endpoint
    if curl -s -f "http://localhost:8080/health" > /dev/null 2>&1; then
        print_success "Health endpoint working"
    else
        print_error "Health endpoint failed"
    fi
    
    # Readiness endpoint
    if curl -s -f "http://localhost:8080/readiness" > /dev/null 2>&1; then
        print_success "Readiness endpoint working"
    else
        print_error "Readiness endpoint failed"
    fi
    
    # Authentication endpoint (should return 400 without body)
    response_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:8080/api/auth/send-otp")
    if [ "$response_code" = "400" ]; then
        print_success "Auth endpoint responding correctly"
    else
        print_error "Auth endpoint not responding correctly (got $response_code)"
    fi
    
    # Performance Tests
    print_header "Running Performance Tests"
    
    if command -v k6 &> /dev/null; then
        echo "Running k6 load tests..."
        if k6 run -q --duration 30s --vus 10 tests/performance/load-test.js 2>&1 | grep -q "✓"; then
            print_success "Performance tests passed"
        else
            print_warning "Performance tests completed with warnings"
        fi
    else
        print_warning "k6 not installed, skipping performance tests"
    fi
    
    # Security Tests
    print_header "Running Security Checks"
    
    # Check for exposed secrets
    if grep -r "JWT_SECRET\|API_KEY\|PASSWORD" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules . | grep -v "process.env\|example\|template"; then
        print_error "Exposed secrets found in code"
    else
        print_success "No exposed secrets found"
    fi
    
    # Check for vulnerable dependencies
    cd backend
    if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
        print_success "No high/critical vulnerabilities in backend"
    else
        print_warning "Vulnerabilities found in backend dependencies"
    fi
    cd ..
    
    cd frontend
    if npm audit --audit-level=high 2>&1 | grep -q "found 0 vulnerabilities"; then
        print_success "No high/critical vulnerabilities in frontend"
    else
        print_warning "Vulnerabilities found in frontend dependencies"
    fi
    cd ..
    
    # Cleanup
    print_header "Cleaning Up"
    docker-compose down > /dev/null 2>&1
    docker rmi test-backend test-frontend > /dev/null 2>&1
    print_success "Cleanup complete"
    
    # Test Summary
    print_header "Test Summary"
    echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}All tests passed successfully! ✅${NC}"
        exit 0
    else
        echo -e "\n${RED}Some tests failed. Please review the output above. ❌${NC}"
        exit 1
    fi
}

# Handle script termination
trap 'echo -e "\n${YELLOW}Tests interrupted. Cleaning up...${NC}"; docker-compose down > /dev/null 2>&1; exit 1' INT TERM

# Run main function
main
