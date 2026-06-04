variable "qovery_project_id" {
  description = "Qovery project ID (existing tic-tac-toe project)"
  type        = string
}

variable "qovery_cluster_id" {
  description = "Qovery cluster ID (GCP Colombus)"
  type        = string
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "feat/local-multiplayer"
}
