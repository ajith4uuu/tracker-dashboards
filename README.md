# PROgress Tracker - Modern Stack Implementation

## 🎗️ Breast Cancer Patient Survey Analytics Platform

A production-ready, modern web application for tracking and analyzing breast cancer patient survey data with AI-powered insights.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **Redux Toolkit** for state management
- **React Query** for server state
- **Chart.js & Recharts** for data visualization
- **Formik & Yup** for form handling
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **BigQuery** for data warehouse
- **Gemini AI** for insights generation
- **JWT** authentication with OTP
- **Redis** for session management

### Infrastructure
- **Docker** containers
- **Google Cloud Run** for deployment
- **Auto-scaling** configuration
- **CI/CD** ready

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Google Cloud SDK
- GCP Account with billing enabled
- Gemini API key

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/progress-tracker.git
cd progress-tracker
```

### 2. Environment Configuration

#### Backend (.env)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

Required variables:
- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GEMINI_API_KEY`: Your Gemini AI API key
- `JWT_SECRET`: Strong secret for JWT tokens
- `EMAIL_SERVICE_URL`: https://email-backend-1062713216421.northamerica-northeast2.run.app

#### Frontend (.env)
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed
```

### 3. Local Development

#### Using Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm start
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/api-docs

## 🚀 Deployment to Google Cloud Run

### Automated Deployment
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh

# Follow the prompts:
# 1. Enter GCP Project ID
# 2. Enter Gemini API key
# 3. Choose region (default: northamerica-northeast2)
```

### Manual Deployment

1. **Build and push images:**
```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker northamerica-northeast2-docker.pkg.dev

# Build and push backend
cd backend
docker build -t northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/backend:latest .
docker push northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/backend:latest

# Build and push frontend
cd ../frontend
docker build -t northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/frontend:latest .
docker push northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/frontend:latest
```

2. **Deploy to Cloud Run:**
```bash
# Deploy backend
gcloud run deploy progress-tracker-backend \
  --image northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/backend:latest \
  --platform managed \
  --region northamerica-northeast2 \
  --allow-unauthenticated

# Deploy frontend
gcloud run deploy progress-tracker-frontend \
  --image northamerica-northeast2-docker.pkg.dev/PROJECT_ID/progress-tracker/frontend:latest \
  --platform managed \
  --region northamerica-northeast2 \
  --allow-unauthenticated
```

## 🔑 Key Features

### Authentication
- Email-based OTP authentication
- JWT token management
- Secure session handling
- Auto-refresh tokens

### Data Upload
- Drag-and-drop file upload
- Support for CSV, XLS, XLSX formats
- Real-time upload progress
- Batch processing capability

### Analytics Dashboard
- Real-time metrics and KPIs
- Interactive charts and visualizations
- AI-powered insights
- Customizable time ranges

### Patient Journey Tracking
- Individual patient timelines
- Risk assessment
- Clinical notes
- Engagement scoring

### Advanced Analytics
- Trend analysis
- Cohort analysis
- Funnel visualization
- Comparative analysis

## 📊 BigQuery Schema

### Tables

#### survey_data
```sql
- patient_id: STRING
- event_name: STRING
- timestamp: TIMESTAMP
- responses: JSON
- metadata: JSON
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### analytics_results
```sql
- metric: STRING
- value: FLOAT64
- dimension: STRING
- timestamp: TIMESTAMP
- calculation_date: DATE
- metadata: JSON
```

#### patient_journeys
```sql
- patient_id: STRING
- journey_id: STRING
- events: JSON
- total_events: INTEGER
- completion_rate: FLOAT64
- engagement_score: FLOAT64
- first_event: TIMESTAMP
- last_event: TIMESTAMP
```

## 🔒 Security

- JWT authentication with secure token storage
- CORS configuration
- Rate limiting
- Input validation
- XSS protection
- CSRF protection
- Security headers (Helmet.js)
- Environment variable protection

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Upload
- `POST /api/upload/single` - Upload single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/history` - Get upload history

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/trends` - Get trend analysis
- `GET /api/analytics/compare` - Compare periods
- `GET /api/analytics/funnel` - Funnel analysis
- `GET /api/analytics/cohorts` - Cohort analysis

### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id/journey` - Get patient journey
- `GET /api/patients/:id/analytics` - Get patient analytics
- `POST /api/patients/:id/notes` - Add clinical note
- `GET /api/patients/:id/risk` - Get risk assessment

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                # Unit tests
npm run test:integration # Integration tests
npm run test:coverage   # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test               # Unit tests
npm run test:coverage  # Coverage report
```

## 📈 Monitoring

### Health Checks
- `/health` - Basic health check
- `/readiness` - Readiness probe
- `/liveness` - Liveness probe
- `/metrics` - Prometheus metrics

### Logging
- Winston logger for backend
- Structured logging
- Log aggregation support
- Error tracking

## 🎨 Customization

### Theme
Edit `frontend/src/theme/theme.ts` to customize:
- Colors
- Typography
- Component styles
- Dark/light mode

### Configuration
Edit environment variables for:
- API endpoints
- Feature flags
- Rate limits
- Cache settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Email: support@progresstracker.ca
- Documentation: https://docs.progresstracker.ca
- Issues: GitHub Issues

## 🙏 Acknowledgments

- Built for breast cancer research and patient care
- Powered by Google Cloud Platform
- AI insights by Google Gemini
- UI components by Material-UI

---

**Made with 💗 for breast cancer awareness and patient care**
