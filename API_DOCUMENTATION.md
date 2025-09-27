# PROgress Tracker API Documentation

## Base URL
- Development: `http://localhost:8080`
- Production: `https://api.progresstracker.ca`

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "expiresIn": "600000"
}
```

---

#### Verify OTP
```http
POST /api/auth/verify-otp
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt-token-here",
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  },
  "expiresIn": "7d"
}
```

---

#### Refresh Token
```http
POST /api/auth/refresh-token
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "token": "new-jwt-token",
  "expiresIn": "7d"
}
```

---

#### Logout
```http
POST /api/auth/logout
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### Get Current User
```http
GET /api/auth/me
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z",
    "metadata": {}
  }
}
```

---

### Upload

#### Upload Single File
```http
POST /api/upload/single
```
**Authorization:** Required  
**Content-Type:** `multipart/form-data`

**Request:**
- `file`: File (CSV, XLS, or XLSX)

**Response:**
```json
{
  "success": true,
  "message": "File uploaded and processed successfully",
  "data": {
    "fileName": "survey_data.csv",
    "recordsProcessed": 150,
    "insights": [
      "High engagement rate detected",
      "Completion rate above average"
    ],
    "recommendations": [
      "Consider follow-up surveys",
      "Focus on patient retention"
    ]
  }
}
```

---

#### Upload Multiple Files
```http
POST /api/upload/multiple
```
**Authorization:** Required  
**Content-Type:** `multipart/form-data`

**Request:**
- `files`: Array of Files

**Response:**
```json
{
  "success": true,
  "message": "Processed 3 files",
  "results": [
    {
      "fileName": "file1.csv",
      "recordsProcessed": 100,
      "status": "success"
    },
    {
      "fileName": "file2.xlsx",
      "recordsProcessed": 200,
      "status": "success"
    }
  ],
  "insights": "Overall data quality is high"
}
```

---

#### Get Upload History
```http
GET /api/upload/history
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "uploads": [
    {
      "fileName": "survey_jan_2024.csv",
      "uploadDate": "2024-01-15T10:30:00Z",
      "recordCount": 150
    }
  ]
}
```

---

### Analytics

#### Get Dashboard Data
```http
GET /api/analytics/dashboard?timeRange=week
```
**Authorization:** Required

**Query Parameters:**
- `timeRange`: `day` | `week` | `month` | `year` (default: `week`)

**Response:**
```json
{
  "success": true,
  "timeRange": "week",
  "data": {
    "totalPatients": 542,
    "totalEvents": 1823,
    "eventDistribution": [
      {
        "eventName": "initial_survey",
        "count": 542
      }
    ],
    "patientActivity": [
      {
        "date": "2024-01-15",
        "uniquePatients": 45,
        "totalEvents": 120
      }
    ],
    "completionRates": [
      {
        "eventName": "initial_survey",
        "started": 542,
        "completed": 480,
        "completionRate": 88.56
      }
    ]
  },
  "insights": {
    "summary": "Patient engagement is trending upward",
    "keyPoints": [
      "15% increase in weekly active patients",
      "Completion rates above target"
    ],
    "recommendations": [
      "Maintain current engagement strategies",
      "Consider adding new survey types"
    ]
  }
}
```

---

#### Get Trends
```http
GET /api/analytics/trends
```
**Authorization:** Required

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string
- `metric`: Optional metric filter

**Response:**
```json
{
  "success": true,
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "trends": [
    {
      "date": "2024-01-15",
      "unique_patients": 45,
      "total_events": 120,
      "avg_satisfaction": 4.2,
      "avg_pain_level": 3.1
    }
  ],
  "insights": {
    "patterns": [
      "Weekly cycle detected in patient activity"
    ],
    "predictions": [
      "Expected 10% increase next week"
    ],
    "summary": "Positive trend in patient engagement"
  }
}
```

---

#### Compare Periods
```http
GET /api/analytics/compare
```
**Authorization:** Required

**Query Parameters:**
- `period1Start`: ISO date string
- `period1End`: ISO date string
- `period2Start`: ISO date string
- `period2End`: ISO date string

**Response:**
```json
{
  "success": true,
  "comparison": {
    "period1": {
      "dates": {
        "start": "2024-01-01",
        "end": "2024-01-15"
      },
      "metrics": {
        "unique_patients": 250,
        "total_events": 800
      }
    },
    "period2": {
      "dates": {
        "start": "2024-01-16",
        "end": "2024-01-31"
      },
      "metrics": {
        "unique_patients": 292,
        "total_events": 950
      }
    },
    "changes": {
      "unique_patients": {
        "absolute": 42,
        "percent": "16.8",
        "direction": "increase"
      }
    }
  }
}
```

---

#### Funnel Analysis
```http
GET /api/analytics/funnel
```
**Authorization:** Required

**Query Parameters:**
- `events`: Comma-separated event names
- `startDate`: Optional ISO date
- `endDate`: Optional ISO date

**Response:**
```json
{
  "success": true,
  "funnel": [
    {
      "event": "registration",
      "patients": 1000,
      "step": 1
    },
    {
      "event": "first_survey",
      "patients": 850,
      "step": 2
    }
  ],
  "conversions": [
    {
      "from": "registration",
      "to": "first_survey",
      "rate": "85.00"
    }
  ],
  "overallConversion": "42.50"
}
```

---

#### Cohort Analysis
```http
GET /api/analytics/cohorts
```
**Authorization:** Required

**Query Parameters:**
- `cohortBy`: `week` | `month` (default: `month`)
- `metric`: `retention` | `engagement` (default: `retention`)

**Response:**
```json
{
  "success": true,
  "cohortBy": "month",
  "metric": "retention",
  "cohorts": [
    {
      "cohort": "2024-01-01T00:00:00Z",
      "day_0": 100,
      "week_1": 85,
      "week_2": 72,
      "month_1": 65,
      "after_month": 60
    }
  ]
}
```

---

#### Export Data
```http
GET /api/analytics/export
```
**Authorization:** Required

**Query Parameters:**
- `format`: `csv` | `json`
- `table`: Table name to export
- `startDate`: Optional filter
- `endDate`: Optional filter

**Response:**
- For CSV: File download
- For JSON: JSON data

---

### Patients

#### Get Patients List
```http
GET /api/patients
```
**Authorization:** Required

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search query
- `sortBy`: Sort field
- `sortOrder`: `asc` | `desc`

**Response:**
```json
{
  "success": true,
  "patients": [
    {
      "patientId": "PAT001",
      "totalEvents": 15,
      "firstEvent": "2024-01-01T00:00:00Z",
      "lastEvent": "2024-01-15T00:00:00Z",
      "uniqueEvents": 5,
      "avgSatisfaction": 4.2,
      "daysInactive": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 542,
    "totalPages": 28
  }
}
```

---

#### Get Patient Journey
```http
GET /api/patients/:patientId/journey
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "journey": {
    "patientId": "PAT001",
    "events": [
      {
        "eventName": "initial_survey",
        "timestamp": "2024-01-01T10:00:00Z",
        "details": {
          "completed": true,
          "satisfaction_score": 4
        }
      }
    ],
    "metrics": {
      "totalEvents": 15,
      "completionRate": 86.7,
      "engagementScore": 78
    },
    "insights": {
      "summary": "Patient shows consistent engagement",
      "patterns": [
        "Regular weekly check-ins"
      ],
      "recommendations": [
        "Continue current treatment plan"
      ]
    }
  }
}
```

---

#### Get Patient Timeline
```http
GET /api/patients/:patientId/timeline
```
**Authorization:** Required

**Query Parameters:**
- `startDate`: Optional filter
- `endDate`: Optional filter

**Response:**
```json
{
  "success": true,
  "patientId": "PAT001",
  "timeline": [
    {
      "eventName": "initial_survey",
      "timestamp": "2024-01-01T10:00:00Z",
      "details": {
        "responses": {
          "q1": "yes",
          "q2": "no"
        }
      },
      "metadata": {}
    }
  ]
}
```

---

#### Get Patient Analytics
```http
GET /api/patients/:patientId/analytics
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "patientId": "PAT001",
  "analytics": {
    "metrics": {
      "total_surveys": 15,
      "unique_events": 5,
      "avg_satisfaction": 4.2,
      "avg_pain": 3.1,
      "avg_mood": 3.8,
      "avg_energy": 3.5,
      "first_survey": "2024-01-01T00:00:00Z",
      "last_survey": "2024-01-15T00:00:00Z",
      "days_active": 15
    },
    "trends": [
      {
        "date": "2024-01-15",
        "satisfaction": 4.5,
        "pain": 2.8,
        "mood": 4.2
      }
    ]
  }
}
```

---

#### Add Patient Note
```http
POST /api/patients/:patientId/notes
```
**Authorization:** Required

**Request Body:**
```json
{
  "note": "Patient reported improvement in symptoms"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully"
}
```

---

#### Get Patient Notes
```http
GET /api/patients/:patientId/notes
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "notes": [
    {
      "timestamp": "2024-01-15T14:30:00Z",
      "content": "Patient reported improvement",
      "author": "doctor@clinic.com",
      "metadata": {}
    }
  ]
}
```

---

#### Get Patient Risk Assessment
```http
GET /api/patients/:patientId/risk
```
**Authorization:** Required

**Response:**
```json
{
  "success": true,
  "patientId": "PAT001",
  "riskAssessment": {
    "level": "medium",
    "factors": {
      "lowEngagement": false,
      "decliningScores": true,
      "missedSurveys": false,
      "highPainLevels": true
    },
    "insights": [
      "Pain levels trending upward",
      "Consider intervention"
    ],
    "recommendations": [
      "Schedule follow-up appointment",
      "Review pain management plan"
    ],
    "lastUpdated": "2024-01-15T15:00:00Z"
  }
}
```

---

### Health & Monitoring

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

---

#### Readiness Check
```http
GET /readiness
```

**Response:**
```json
{
  "status": "ready",
  "checks": {
    "server": true,
    "bigquery": true,
    "gemini": true,
    "redis": false
  }
}
```

---

#### Liveness Check
```http
GET /liveness
```

**Response:**
```
OK
```

---

#### System Status
```http
GET /status
```

**Response:**
```json
{
  "application": {
    "name": "Progress Tracker Backend",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600,
    "memory": {
      "rss": 104857600,
      "heapTotal": 52428800,
      "heapUsed": 41943040
    }
  },
  "services": {
    "bigquery": {
      "status": "connected",
      "dataset": "progress_tracker",
      "location": "northamerica-northeast2"
    },
    "gemini": {
      "available": true,
      "model": "gemini-pro",
      "configured": true
    },
    "redis": {
      "connected": false,
      "url": "not configured"
    },
    "email": {
      "url": "https://email-backend.run.app",
      "configured": true
    }
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

#### Metrics (Prometheus Format)
```http
GET /metrics
```

**Response:**
```
# HELP process_memory_heap_used_bytes Process heap memory used
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes 41943040

# HELP process_uptime_seconds Process uptime
# TYPE process_uptime_seconds gauge
process_uptime_seconds 3600

# HELP service_health Service health status
# TYPE service_health gauge
service_health{service="bigquery"} 1
service_health{service="gemini"} 1
service_health{service="redis"} 0
```

---

## Error Responses

All endpoints may return these standard error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "path": "/api/unknown"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP
- Upload endpoints: 10 requests per hour per user
- Export endpoints: 5 requests per hour per user

---

## File Upload Specifications

### Supported Formats
- CSV (.csv)
- Excel (.xlsx, .xls)

### File Size Limits
- Maximum file size: 10 MB
- Maximum files per batch: 10

### Expected CSV Structure
```csv
patient_id,event_name,timestamp,question_1,question_2
PAT001,initial_survey,2024-01-01T10:00:00Z,yes,no
```

### Expected Excel Structure
- Sheet 1: Patient Data
  - Columns: patient_id, event_name, timestamp, responses...
- Sheet 2: Metadata (optional)

---

## Webhooks (Coming Soon)

Configure webhooks to receive real-time notifications:

```json
{
  "url": "https://your-webhook-url.com",
  "events": ["upload.completed", "analysis.ready"],
  "secret": "webhook-secret"
}
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.progresstracker.ca',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get dashboard data
const dashboard = await api.get('/api/analytics/dashboard');

// Upload file
const formData = new FormData();
formData.append('file', file);
const upload = await api.post('/api/upload/single', formData);
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

# Get dashboard data
response = requests.get(
    'https://api.progresstracker.ca/api/analytics/dashboard',
    headers=headers
)

# Upload file
files = {'file': open('data.csv', 'rb')}
response = requests.post(
    'https://api.progresstracker.ca/api/upload/single',
    headers=headers,
    files=files
)
```

### cURL
```bash
# Get dashboard data
curl -X GET https://api.progresstracker.ca/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upload file
curl -X POST https://api.progresstracker.ca/api/upload/single \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@data.csv"
```

---

## Support

For API support and questions:
- Email: api-support@progresstracker.ca
- Documentation: https://docs.progresstracker.ca/api
- Status Page: https://status.progresstracker.ca
