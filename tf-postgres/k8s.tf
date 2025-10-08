resource "kubernetes_secret" "db_url" {
  count = var.create_k8s_secret ? 1 : 0

  metadata {
    name      = var.k8s_secret_name
    namespace = var.k8s_namespace
  }

  data = {
    DATABASE_URL = base64encode(azurerm_postgresql_flexible_server.pg.administrator_login == "" ? "" : format("postgresql://%s:%s@%s:5432/%s?sslmode=require", azurerm_postgresql_flexible_server.pg.administrator_login, random_password.pg_admin.result, azurerm_postgresql_flexible_server.pg.fqdn, azurerm_postgresql_flexible_server_database.appdb.name))
  }

  type = "Opaque"

  depends_on = [azurerm_postgresql_flexible_server.pg]
}
