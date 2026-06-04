output "environment_id" {
  description = "Qovery environment ID for testing"
  value       = qovery_environment.testing.id
}

output "tic_tac_toe_external_host" {
  description = "Public hostname of the tic-tac-toe application"
  value       = qovery_application.tic_tac_toe.external_host
}

output "tic_tac_toe_url" {
  description = "Public URL of the tic-tac-toe application"
  value       = "https://${qovery_application.tic_tac_toe.external_host}"
}

output "postgres_id" {
  description = "Qovery database ID for postgres"
  value       = qovery_database.postgres.id
}
