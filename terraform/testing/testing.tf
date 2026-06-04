# =============================================================================
# Environment: testing  (Local Multiplayer feature validation)
# Cluster: GCP Colombus | Project: tic-tac-toe
# =============================================================================

resource "qovery_environment" "testing" {
  project_id = var.qovery_project_id
  cluster_id = var.qovery_cluster_id
  name       = "testing"
  mode       = "DEVELOPMENT"
}

# =============================================================================
# Database: postgres (CONTAINER mode — cheap, ephemeral, safe to recreate)
# =============================================================================

resource "qovery_database" "postgres" {
  environment_id = qovery_environment.testing.id
  name           = "postgres"
  type           = "POSTGRESQL"
  version        = "16"
  mode           = "CONTAINER"
  accessibility  = "PRIVATE"
  cpu            = 250
  memory         = 512
  storage        = 10
}

# =============================================================================
# Application: tic-tac-toe  (built from the feature branch)
# =============================================================================

resource "qovery_application" "tic_tac_toe" {
  environment_id = qovery_environment.testing.id
  name           = "tic-tac-toe"

  git_repository = {
    url       = "https://github.com/evoxmusic/tic-tac-toe-demo-2.git"
    branch    = var.git_branch
    root_path = "/"
  }

  build_mode            = "DOCKER"
  dockerfile_path       = "Dockerfile"
  cpu                   = 250
  memory                = 256
  min_running_instances = 1
  max_running_instances = 1
  auto_preview          = false
  auto_deploy           = true

  ports = [
    {
      name                = "http"
      internal_port       = 3000
      external_port       = 443
      publicly_accessible = true
      protocol            = "HTTP"
      is_default          = true
    }
  ]

  healthchecks = {
    readiness_probe = {
      type = {
        tcp = {
          port = 3000
        }
      }
      initial_delay_seconds = 10
      period_seconds        = 10
      timeout_seconds       = 5
      success_threshold     = 1
      failure_threshold     = 3
    }
    liveness_probe = {
      type = {
        tcp = {
          port = 3000
        }
      }
      initial_delay_seconds = 30
      period_seconds        = 10
      timeout_seconds       = 5
      success_threshold     = 1
      failure_threshold     = 3
    }
  }

  environment_variables = [
    {
      key   = "PORT"
      value = "3000"
    },
    {
      key   = "DATABASE_URL"
      value = "postgresql://${qovery_database.postgres.login}:${qovery_database.postgres.password}@${qovery_database.postgres.internal_host}:${qovery_database.postgres.port}/postgres"
    },
  ]
}

# =============================================================================
# Deployment — deploys the whole environment once on apply
# =============================================================================

resource "qovery_deployment" "testing" {
  environment_id = qovery_environment.testing.id
  desired_state  = "RUNNING"

  depends_on = [
    qovery_database.postgres,
    qovery_application.tic_tac_toe,
  ]
}
