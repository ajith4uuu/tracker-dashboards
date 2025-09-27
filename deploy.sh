#!/bin/bash

# Progress Tracker Deployment Script for Google Cloud Run
# This script automates the deployment of both backend and frontend services

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_message "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_message "All requirements met!"
}

# Get user inputs
get_user_inputs() {
    print_message "Please provide deployment configuration..."
    
    read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
    read -p "Enter your Gemini API Key: " GEMINI_API_KEY
    read -p "Enter the GCP region (default: northamerica-northeast2): " GCP_REGION
    GCP_REGION=${GCP_REGION:-northamerica-northeast2}
    
    # Generate random JWT secret if not provided
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    print_message "Configuration received!"
}

# Set up GCP project
setup_gcp_project() {
    print_message "Setting up GCP project..."
    
    # Set the project
    gcloud config set project $GCP_PROJECT_ID
    
    # Enable required APIs
    print_message "Enabling required GCP APIs..."
    gcloud services enable \
        cloudrun.googleapis.com \
        cloudbuild.googleapis.com \
        bigquery.googleapis.com \
        artifactregistry.googleapis.com \
        secretmanager.googleapis.com
    
    print_message "GCP project setup complete!"
}

# Create BigQuery dataset
setup_bigquery() {
    print_message "Setting up BigQuery dataset..."
    
    # Create dataset if it doesn't exist
    bq mk --dataset \
        --location=$GCP_REGION \
        --description="Progress Tracker Dataset" \
        $GCP_PROJECT_ID:progress_tracker || print_warning "Dataset may already exist"
    
    print_message "BigQuery setup complete!"
}

# Build and push Docker images
build_and_push_images() {
    print_message "Building and pushing Docker images..."
    
    # Configure Docker for Artifact Registry
    gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev
    
    # Create Artifact Registry repository if it doesn't exist
    gcloud artifacts repositories create progress-tracker \
        --repository-format=docker \
        --location=$GCP_REGION \
        --description="Progress Tracker Docker Images" || print_warning "Repository may already exist"
    
    # Build and push backend
    print_message "Building backend image..."
    cd backend
    docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest .
    docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest
    cd ..
    
    # Build and push frontend
    print_message "Building frontend image..."
    cd frontend
    docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest .
    docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest
    cd ..
    
    print_message "Docker images built and pushed successfully!"
}

# Deploy backend to Cloud Run
deploy_backend() {
    print_message "Deploying backend to Cloud Run..."
    
    gcloud run deploy progress-tracker-backend \
        --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated \
        --min-instances 0 \
        --max-instances 10 \
        --memory 1Gi \
        --cpu 1 \
        --port 8080 \
        --set-env-vars "\
NODE_ENV=production,\
PORT=8080,\
JWT_SECRET=$JWT_SECRET,\
SESSION_SECRET=$SESSION_SECRET,\
GCP_PROJECT_ID=$GCP_PROJECT_ID,\
BIGQUERY_DATASET=progress_tracker,\
GCP_LOCATION=$GCP_REGION,\
GEMINI_API_KEY=$GEMINI_API_KEY,\
EMAIL_SERVICE_URL=https://email-backend-1062713216421.northamerica-northeast2.run.app,\
ALLOWED_ORIGINS=https://progress-tracker-frontend-*.run.app"
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe progress-tracker-backend \
        --platform managed \
        --region $GCP_REGION \
        --format 'value(status.url)')
    
    print_message "Backend deployed at: $BACKEND_URL"
}

# Deploy frontend to Cloud Run
deploy_frontend() {
    print_message "Deploying frontend to Cloud Run..."
    
    # Update frontend nginx.conf with backend URL
    sed -i.bak "s|http://backend:8080|$BACKEND_URL|g" frontend/nginx.conf
    
    # Rebuild frontend with updated configuration
    cd frontend
    docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest .
    docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest
    cd ..
    
    # Deploy frontend
    gcloud run deploy progress-tracker-frontend \
        --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest \
        --platform managed \
        --region $GCP_REGION \
        --allow-unauthenticated \
        --min-instances 0 \
        --max-instances 10 \
        --memory 512Mi \
        --cpu 1 \
        --port 80
    
    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe progress-tracker-frontend \
        --platform managed \
        --region $GCP_REGION \
        --format 'value(status.url)')
    
    print_message "Frontend deployed at: $FRONTEND_URL"
}

# Update backend with frontend URL for CORS
update_backend_cors() {
    print_message "Updating backend CORS settings..."
    
    gcloud run services update progress-tracker-backend \
        --platform managed \
        --region $GCP_REGION \
        --update-env-vars "ALLOWED_ORIGINS=$FRONTEND_URL"
    
    print_message "CORS settings updated!"
}

# Create service account and set IAM permissions
setup_iam() {
    print_message "Setting up IAM permissions..."
    
    # Create service account
    gcloud iam service-accounts create progress-tracker-sa \
        --display-name="Progress Tracker Service Account" || print_warning "Service account may already exist"
    
    # Grant BigQuery permissions
    gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
        --member="serviceAccount:progress-tracker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/bigquery.dataEditor"
    
    gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
        --member="serviceAccount:progress-tracker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
        --role="roles/bigquery.jobUser"
    
    # Update Cloud Run service to use service account
    gcloud run services update progress-tracker-backend \
        --platform managed \
        --region $GCP_REGION \
        --service-account progress-tracker-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com
    
    print_message "IAM setup complete!"
}

# Main deployment function
main() {
    print_message "Starting Progress Tracker deployment..."
    
    check_requirements
    get_user_inputs
    setup_gcp_project
    setup_bigquery
    build_and_push_images
    deploy_backend
    deploy_frontend
    update_backend_cors
    setup_iam
    
    print_message "========================================="
    print_message "Deployment completed successfully!"
    print_message "========================================="
    print_message "Frontend URL: $FRONTEND_URL"
    print_message "Backend URL: $BACKEND_URL"
    print_message "========================================="
    print_message ""
    print_message "Next steps:"
    print_message "1. Visit $FRONTEND_URL to access your application"
    print_message "2. Configure a custom domain if needed"
    print_message "3. Set up monitoring and alerts in Cloud Console"
    print_message "4. Review security settings and enable additional features"
}

# Run main function
main
