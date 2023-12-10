resource "google_cloud_run_v2_service" "mosq_center" {
  name     = "mosq-center"
  location = local.region
  project  = local.project_id

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }

    max_instance_request_concurrency = 200
    timeout                          = "10s"

    containers {
      image = var.artifact_registry_docker_image

      env {
        name  = "AUTH0_ENABLE"
        value = "false"
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
