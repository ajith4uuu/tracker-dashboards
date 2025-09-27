#!/bin/bash

# PROgress Tracker - Package Script
# This script packages the application for deployment

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PROgress Tracker - Package Builder${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Clean up previous builds
echo -e "${YELLOW}Cleaning up previous builds...${NC}"
rm -rf progress-tracker-package.tar.gz
rm -rf backend/dist backend/node_modules
rm -rf frontend/build frontend/node_modules

# Install backend dependencies and build
echo -e "${YELLOW}Building backend...${NC}"
cd backend
npm ci
npm run build
cd ..

# Install frontend dependencies and build
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm ci
npm run build
cd ..

# Create package directory
echo -e "${YELLOW}Creating package...${NC}"
mkdir -p package-temp

# Copy necessary files
cp -r backend package-temp/
cp -r frontend package-temp/
cp docker-compose.yml package-temp/
cp deploy.sh package-temp/
cp README.md package-temp/
cp .env.production.template package-temp/
cp .gitignore package-temp/

# Clean up unnecessary files from package
cd package-temp
find . -name "node_modules" -type d -prune -exec rm -rf {} +
find . -name ".env" -type f -delete
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete
cd ..

# Create tar.gz archive
echo -e "${YELLOW}Creating archive...${NC}"
tar -czf progress-tracker-package.tar.gz -C package-temp .

# Clean up temp directory
rm -rf package-temp

# Calculate package size
PACKAGE_SIZE=$(du -h progress-tracker-package.tar.gz | cut -f1)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Package created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Package name: progress-tracker-package.tar.gz"
echo -e "Package size: ${PACKAGE_SIZE}"
echo -e ""
echo -e "To deploy:"
echo -e "1. Extract: tar -xzf progress-tracker-package.tar.gz"
echo -e "2. Configure: cp .env.production.template backend/.env"
echo -e "3. Deploy: ./deploy.sh"
echo -e "${GREEN}========================================${NC}"
