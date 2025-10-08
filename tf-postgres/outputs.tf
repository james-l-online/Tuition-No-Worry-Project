output "postgresql_database_url" {
  description = "Connection string for the app to use (sensitive)"
  value       = "postgresql://${azurerm_postgresql_flexible_server.pg.administrator_login}:${random_password.pg_admin.result}@${azurerm_postgresql_flexible_server.pg.fqdn}:5432/${azurerm_postgresql_flexible_server_database.appdb.name}?sslmode=require"
  sensitive   = true
}

output "postgres_admin_password" {
  description = "Admin password (sensitive)"
  value       = random_password.pg_admin.result
  sensitive   = true
}
