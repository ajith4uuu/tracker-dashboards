# Terraform configuration for PROgress Tracker infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "progress-tracker-terraform-state"
    prefix = "terraform/state"
  }
}

# Provider configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "northamerica-northeast2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "cloudrun.googleapis.com",
    "cloudbuild.googleapis.com",
    "bigquery.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "redis.googleapis.com",
    "cloudscheduler.googleapis.com",
  ])
  
  project = var.project_id
  service = each.value
  
  disable_on_destroy = false
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "docker_repo" {
  location      = var.region
  repository_id = "progress-tracker"
  description   = "Docker repository for Progress Tracker"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}

# BigQuery Dataset
resource "google_bigquery_dataset" "progress_tracker" {
  dataset_id    = "progress_tracker"
  friendly_name = "Progress Tracker Dataset"
  description   = "Dataset for breast cancer patient survey data"
  location      = var.region
  
  default_table_expiration_ms = 7776000000 # 90 days
  
  labels = {
    environment = var.environment
    application = "progress-tracker"
  }
  
  depends_on = [google_project_service.apis]
}

# BigQuery Tables
resource "google_bigquery_table" "survey_data" {
  dataset_id = google_bigquery_dataset.progress_tracker.dataset_id
  table_id   = "survey_data"
  
  schema = jsonencode([
    {
      name = "patient_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "event_name"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "responses"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "metadata"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
  
  time_partitioning {
    type  = "DAY"
    field = "timestamp"
  }
  
  labels = {
    environment = var.environment
  }
}

resource "google_bigquery_table" "analytics_results" {
  dataset_id = google_bigquery_dataset.progress_tracker.dataset_id
  table_id   = "analytics_results"
  
  schema = jsonencode([
    {
      name = "metric"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "value"
      type = "FLOAT64"
      mode = "REQUIRED"
    },
    {
      name = "dimension"
      type = "STRING"
      mode = "NULLABLE"
    },
    {
      name = "timestamp"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "calculation_date"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "metadata"
      type = "JSON"
      mode = "NULLABLE"
    }
  ])
  
  time_partitioning {
    type  = "DAY"
    field = "calculation_date"
  }
  
  labels = {
    environment = var.environment
  }
}

resource "google_bigquery_table" "patient_journeys" {
  dataset_id = google_bigquery_dataset.progress_tracker.dataset_id
  table_id   = "patient_journeys"
  
  schema = jsonencode([
    {
      name = "patient_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "journey_id"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "events"
      type = "JSON"
      mode = "NULLABLE"
    },
    {
      name = "total_events"
      type = "INTEGER"
      mode = "REQUIRED"
    },
    {
      name = "completion_rate"
      type = "FLOAT64"
      mode = "NULLABLE"
    },
    {
      name = "engagement_score"
      type = "FLOAT64"
      mode = "NULLABLE"
    },
    {
      name = "first_event"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    },
    {
      name = "last_event"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    },
    {
      name = "created_at"
      type = "TIMESTAMP"
      mode = "REQUIRED"
    },
    {
      name = "updated_at"
      type = "TIMESTAMP"
      mode = "NULLABLE"
    }
  ])
  
  labels = {
    environment = var.environment
  }
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "progress-tracker-sa"
  display_name = "Progress Tracker Service Account"
}

# IAM Roles for Service Account
resource "google_project_iam_member" "bigquery_data_editor" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "secret_accessor" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Secret Manager Secrets
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  
  replication {
    automatic = true
  }
  
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  
  replication {
    automatic = true
  }
  
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "session_secret" {
  secret_id = "session-secret"
  
  replication {
    automatic = true
  }
  
  depends_on = [google_project_service.apis]
}

# Cloud Run Service - Backend
resource "google_cloud_run_service" "backend" {
  name     = "progress-tracker-backend"
  location = var.region
  
  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/progress-tracker/backend:latest"
        
        ports {
          container_port = 8080
        }
        
        env {
          name  = "NODE_ENV"
          value = var.environment
        }
        
        env {
          name  = "PORT"
          value = "8080"
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "BIGQUERY_DATASET"
          value = google_bigquery_dataset.progress_tracker.dataset_id
        }
        
        env {
          name  = "GCP_LOCATION"
          value = var.region
        }
        
        env {
          name  = "EMAIL_SERVICE_URL"
          value = "https://email-backend-1062713216421.northamerica-northeast2.run.app"
        }
        
        env {
          name = "JWT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.jwt_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "GEMINI_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.gemini_api_key.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "SESSION_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.session_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        resources {
          limits = {
            cpu    = "2000m"
            memory = "2Gi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "1"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.docker_repo,
  ]
}

# Cloud Run Service - Frontend
resource "google_cloud_run_service" "frontend" {
  name     = "progress-tracker-frontend"
  location = var.region
  
  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/progress-tracker/frontend:latest"
        
        ports {
          container_port = 80
        }
        
        env {
          name  = "REACT_APP_API_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
        
        resources {
          limits = {
            cpu    = "1000m"
            memory = "512Mi"
          }
        }
      }
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "5"
      }
    }
  }
  
  traffic {
    percent         = 100
    latest_revision = true
  }
  
  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.docker_repo,
    google_cloud_run_service.backend,
  ]
}

# Cloud Run IAM - Allow unauthenticated access
resource "google_cloud_run_service_iam_member" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Scheduler for periodic tasks
resource "google_cloud_scheduler_job" "daily_analytics" {
  name        = "daily-analytics-calculation"
  description = "Calculate daily analytics metrics"
  schedule    = "0 2 * * *" # Run at 2 AM daily
  time_zone   = "America/Toronto"
  
  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_service.backend.status[0].url}/api/analytics/calculate-daily"
    
    oidc_token {
      service_account_email = google_service_account.cloud_run_sa.email
    }
  }
  
  depends_on = [google_project_service.apis]
}

# Outputs
output "backend_url" {
  value       = google_cloud_run_service.backend.status[0].url
  description = "URL of the backend service"
}

output "frontend_url" {
  value       = google_cloud_run_service.frontend.status[0].url
  description = "URL of the frontend application"
}

output "bigquery_dataset" {
  value       = google_bigquery_dataset.progress_tracker.dataset_id
  description = "BigQuery dataset ID"
}

output "service_account_email" {
  value       = google_service_account.cloud_run_sa.email
  description = "Service account email for Cloud Run"
}
