terraform {
  required_version = ">= 1.0"
  required_providers {
    qovery = {
      source  = "qovery/qovery"
      version = "~> 0.54.0"
    }
  }
}

provider "qovery" {
  # Token is read from the QOVERY_API_TOKEN environment variable.
  # export QOVERY_API_TOKEN="qov_your_token_here"
}
