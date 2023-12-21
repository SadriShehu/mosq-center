terraform {
  backend "gcs" {
    bucket = "terraform-state-mosq-center"
    prefix = "terraform/state/mosq-center"
  }

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">=3.5.0"
    }

    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">=3.5.0"
    }
  }

  required_version = ">= 0.12.0"
}
