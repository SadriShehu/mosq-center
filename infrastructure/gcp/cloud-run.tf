resource "google_cloud_run_v2_service" "mosq_center" {
  name     = "mosq-center"
  location = local.region
  project  = local.project_id

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    max_instance_request_concurrency = 200
    timeout                          = "10s"

    volumes {
      name = "mosq-center-secrets"
      secret {
        secret = "user-cert"
        items {
          version = "latest"
          path    = "user-cert"
          mode    = 0
        }
      }
    }
    containers {
      image = var.artifact_registry_docker_image

      volume_mounts {
        name       = "mosq-center-secrets"
        mount_path = "/secrets"
      }

      env {
        name  = "MONGO_USER_CERT_PATH"
        value = "/secrets/user-cert"
      }

      env {
        name  = "ENV"
        value = "prod"
      }

      env {
        name  = "AUTH0_ENABLE"
        value = "true"
      }

      env {
        name  = "AUTH0_DOMAIN"
        value = "mosq-center.eu.auth0.com"
      }

      env {
        name = "AUTH0_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = "AUTH0_CLIENT_ID"
            version = "1"
          }
        }
      }

      env {
        name = "AUTH0_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "AUTH0_CLIENT_SECRET"
            version = "1"
          }
        }
      }

      env {
        name = "AUTH0_CALLBACK_URL"
        // get the cloud run url
        value = "https://xhamia-qender.com/callback"
      }

      env {
        name = "SESSIONS_SECRET"
        value_source {
          secret_key_ref {
            secret  = "SESSIONS_SECRET"
            version = "1"
          }
        }
      }

      env {
        name = "MONGO_DB_URI"
        value_source {
          secret_key_ref {
            secret  = "MONGO_DB_URI"
            version = "1"
          }
        }
      }

      env {
        name  = "MONGO_COLLECTION_NAME"
        value = "center-mosq"
      }

      env {
        name  = "SERVICE_NAME"
        value = "center"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Grant access to all users (public)
resource "google_cloud_run_service_iam_member" "mosq_center_invoker" {
  project  = google_cloud_run_v2_service.mosq_center.project
  service  = google_cloud_run_v2_service.mosq_center.name
  location = google_cloud_run_v2_service.mosq_center.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

### Mosq Qoku Cloud Run
resource "google_cloud_run_v2_service" "mosq_qoku" {
  name     = "mosq-qoku"
  location = local.region
  project  = local.project_id

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    max_instance_request_concurrency = 200
    timeout                          = "10s"

    volumes {
      name = "mosq-center-secrets"
      secret {
        secret = "user-cert"
        items {
          version = "latest"
          path    = "user-cert"
          mode    = 0
        }
      }
    }
    containers {
      image = var.artifact_registry_docker_image

      volume_mounts {
        name       = "mosq-center-secrets"
        mount_path = "/secrets"
      }

      env {
        name  = "MONGO_USER_CERT_PATH"
        value = "/secrets/user-cert"
      }

      env {
        name  = "ENV"
        value = "prod"
      }

      env {
        name  = "AUTH0_ENABLE"
        value = "true"
      }

      env {
        name  = "AUTH0_DOMAIN"
        value = "mosq-center.eu.auth0.com"
      }

      env {
        name = "AUTH0_CLIENT_ID"
        value_source {
          secret_key_ref {
            secret  = "AUTH0_CLIENT_ID"
            version = "1"
          }
        }
      }

      env {
        name = "AUTH0_CLIENT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "AUTH0_CLIENT_SECRET"
            version = "1"
          }
        }
      }

      env {
        name = "AUTH0_CALLBACK_URL"
        // get the cloud run url
        value = "https://xhamia-qender.com/callback"
      }

      env {
        name = "SESSIONS_SECRET"
        value_source {
          secret_key_ref {
            secret  = "SESSIONS_SECRET"
            version = "1"
          }
        }
      }

      env {
        name = "MONGO_DB_URI"
        value_source {
          secret_key_ref {
            secret  = "MONGO_DB_URI"
            version = "1"
          }
        }
      }

      env {
        name  = "MONGO_DB_COLLECTION"
        value = "coki-mosq"
      }

      env {
        name  = "SERVICE_NAME"
        value = "qoku"
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Grant access to all users (public)
resource "google_cloud_run_service_iam_member" "mosq_qoku_invoker" {
  project  = google_cloud_run_v2_service.mosq_qoku.project
  service  = google_cloud_run_v2_service.mosq_qoku.name
  location = google_cloud_run_v2_service.mosq_qoku.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
