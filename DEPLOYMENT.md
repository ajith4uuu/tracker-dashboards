# PROgress Tracker - Deployment Guide

## 📚 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Google Cloud Run Deployment](#google-cloud-run-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 18+ and npm 8+
- Docker and Docker Compose
- Google Cloud SDK (`gcloud`)
- Git

### Required Accounts
- Google Cloud Platform account with billing enabled
- Gemini AI API key

### Required APIs
Enable these APIs in your GCP project:
```bash
gcloud services enable \
  cloudrun.googleapis.com \
  cloudbuild.googleapis.com \
  bigquery.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

## Local Development

### 1. Clone the Repository
```bash
git clone <repository-url>
cd progress-tracker
```

### 2. Environment Setup
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env with your local configuration

# Frontend configuration
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed
```

### 3. Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# Watch logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Manual Development (without Docker)
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm start

# Terminal 3: Redis (optional)
redis-server
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/health

## Production Deployment

### Option 1: Automated Deployment Script

#### Step 1: Prepare Environment
```bash
# Copy production environment template
cp .env.production.template .env.production

# Edit with your production values
nano .env.production
```

Required environment variables:
- `GCP_PROJECT_ID`: Your GCP project ID
- `GEMINI_API_KEY`: Your Gemini AI key
- `JWT_SECRET`: Strong random string (generate with `openssl rand -base64 32`)
- `SESSION_SECRET`: Another strong random string

#### Step 2: Run Deployment Script
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. Set up GCP project and enable APIs
2. Create BigQuery dataset and tables
3. Build and push Docker images
4. Deploy to Cloud Run
5. Configure IAM permissions

### Option 2: Manual Deployment

#### Step 1: Build Docker Images
```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker ${GCP_REGION}-docker.pkg.dev

# Create repository
gcloud artifacts repositories create progress-tracker \
  --repository-format=docker \
  --location=${GCP_REGION} \
  --description="Progress Tracker Docker Images"

# Build and push backend
cd backend
docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest .
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest

# Build and push frontend
cd ../frontend
docker build -t ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest .
docker push ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest
```

#### Step 2: Set Up BigQuery
```bash
# Create dataset
bq mk --dataset \
  --location=${GCP_REGION} \
  --description="Progress Tracker Dataset" \
  ${GCP_PROJECT_ID}:progress_tracker

# Tables will be created automatically on first run
```

#### Step 3: Deploy to Cloud Run
```bash
# Deploy backend
gcloud run deploy progress-tracker-backend \
  --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/backend:latest \
  --platform managed \
  --region ${GCP_REGION} \
  --allow-unauthenticated \
  --set-env-vars-file=.env.production

# Deploy frontend
gcloud run deploy progress-tracker-frontend \
  --image ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/progress-tracker/frontend:latest \
  --platform managed \
  --region ${GCP_REGION} \
  --allow-unauthenticated
```

## Google Cloud Run Deployment

### Service Configuration

#### Backend Service
```yaml
# cloud-run-backend.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: progress-tracker-backend
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '0'
        autoscaling.knative.dev/maxScale: '10'
    spec:
      containers:
      - image: ${IMAGE_URL}
        ports:
        - containerPort: 8080
        resources:
          limits:
            cpu: '2'
            memory: '2Gi'
        env:
        - name: NODE_ENV
          value: production
```

Deploy with:
```bash
gcloud run services replace cloud-run-backend.yaml --region=${GCP_REGION}
```

#### Frontend Service
```yaml
# cloud-run-frontend.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: progress-tracker-frontend
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '0'
        autoscaling.knative.dev/maxScale: '10'
    spec:
      containers:
      - image: ${IMAGE_URL}
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: '1'
            memory: '512Mi'
```

### Custom Domain Setup
```bash
# Verify domain ownership
gcloud domains verify your-domain.com

# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service=progress-tracker-frontend \
  --domain=app.your-domain.com \
  --region=${GCP_REGION}

# Update DNS records as instructed
```

### SSL Certificate
Cloud Run automatically provisions and manages SSL certificates for custom domains.

## Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend-url/health`
- Backend Readiness: `https://your-backend-url/readiness`
- Backend Metrics: `https://your-backend-url/metrics`

### Monitoring Setup
```bash
# Create uptime check
gcloud monitoring uptime-check-configs create progress-tracker \
  --display-name="Progress Tracker Health Check" \
  --monitored-resource="https://your-app-url/health"

# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=${CHANNEL_ID} \
  --display-name="Progress Tracker Alerts" \
  --condition-display-name="High Error Rate" \
  --condition-type=METRIC_THRESHOLD
```

### Logging
```bash
# View backend logs
gcloud run logs read progress-tracker-backend \
  --region=${GCP_REGION} \
  --limit=100

# Stream logs
gcloud run logs tail progress-tracker-backend \
  --region=${GCP_REGION}

# Query logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=progress-tracker-backend \
  AND severity>=ERROR" \
  --limit=50
```

### Backup Strategy
```bash
# BigQuery backup
bq extract \
  --destination_format=CSV \
  --compression=GZIP \
  progress_tracker.survey_data \
  gs://your-backup-bucket/survey_data_$(date +%Y%m%d).csv.gz

# Schedule automatic backups
gcloud scheduler jobs create bigquery \
  backup-progress-tracker \
  --schedule="0 2 * * *" \
  --time-zone="America/Toronto" \
  --uri="https://your-cloud-function-url"
```

## Troubleshooting

### Common Issues

#### 1. BigQuery Permission Errors
```bash
# Grant necessary permissions
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/bigquery.dataEditor"
```

#### 2. CORS Issues
```bash
# Update backend CORS settings
gcloud run services update progress-tracker-backend \
  --update-env-vars="ALLOWED_ORIGINS=https://your-frontend-url"
```

#### 3. Container Startup Issues
```bash
# Check container logs
docker logs progress-tracker-backend

# Inspect running container
docker exec -it progress-tracker-backend sh
```

#### 4. Memory Issues
```bash
# Increase Cloud Run memory limit
gcloud run services update progress-tracker-backend \
  --memory=4Gi \
  --region=${GCP_REGION}
```

### Performance Optimization

#### 1. Enable CDN
```bash
# Set up Cloud CDN for frontend
gcloud compute backend-services update progress-tracker-frontend \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC
```

#### 2. Database Optimization
```sql
-- Create indexes for better query performance
CREATE INDEX idx_patient_timestamp 
ON `progress_tracker.survey_data` (patient_id, timestamp);
```

#### 3. Caching Strategy
- Enable Redis for session management
- Set appropriate cache headers for static assets
- Use BigQuery result caching

### Security Hardening

#### 1. Enable Web Application Firewall
```bash
gcloud compute security-policies create progress-tracker-waf \
  --description="Progress Tracker WAF Policy"

gcloud compute security-policies rules create 1000 \
  --security-policy=progress-tracker-waf \
  --expression="origin.region_code == 'CN'" \
  --action="deny-403"
```

#### 2. Secret Management
```bash
# Store sensitive data in Secret Manager
echo -n "${GEMINI_API_KEY}" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant access to Cloud Run service
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

#### 3. Network Security
```bash
# Restrict access to specific IPs (if needed)
gcloud run services update progress-tracker-backend \
  --ingress=internal-and-cloud-load-balancing \
  --region=${GCP_REGION}
```

## Support

For issues or questions:
- Email: support@progresstracker.ca
- Documentation: https://docs.progresstracker.ca
- GitHub Issues: [Create an issue](https://github.com/your-org/progress-tracker/issues)

## License

Copyright (c) 2024 PROgress Tracker. All rights reserved.
