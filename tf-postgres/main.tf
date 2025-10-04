terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
  }
}

provider "azurerm" {
}

resource "random_password" "pg_admin" {
  length  = 20
  special = true
}

# Postgres Flexible Server
resource "azurerm_postgresql_flexible_server" "pg" {
  name                = var.server_name
  resource_group_name = var.resource_group_name
  location            = var.location

  administrator_login    = var.administrator_login
  administrator_password = random_password.pg_admin.result

  version    = var.postgres_version
  sku_name   = var.sku_name
  storage_mb = var.storage_mb

  # Toggle public vs private access
  public_network_access_enabled = var.public_access

  # Minimal backup and retention
  backup_retention_days = var.backup_retention_days
}

# Private DNS zone for postgres FQDN
// If using private access, create private endpoint and private DNS
resource "azurerm_private_dns_zone" "pg_dns" {
  count               = var.public_access ? 0 : 1
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "pg_dns_link" {
  count                 = var.public_access ? 0 : 1
  name                  = "pg-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.pg_dns[0].name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_endpoint" "pg_pe" {
  count               = var.public_access ? 0 : 1
  name                = "${var.server_name}-pe"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.pe_subnet_id

  private_service_connection {
    name                           = "${var.server_name}-psc"
    is_manual_connection           = false
    private_connection_resource_id = azurerm_postgresql_flexible_server.pg.id
    subresource_names              = ["postgresqlServer"]
  }
}

resource "azurerm_private_dns_a_record" "pg_a" {
  count               = var.public_access ? 0 : 1
  name                = azurerm_postgresql_flexible_server.pg.name
  zone_name           = azurerm_private_dns_zone.pg_dns[0].name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [for c in azurerm_private_endpoint.pg_pe[0].private_service_connection : c.private_ip_address][0]
}

// If using public access, create optional firewall rules for allowed IP ranges
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow" {
  count       = var.public_access ? length(var.allowed_ip_ranges) : 0
  name        = "allow-${count.index}"
  server_id   = azurerm_postgresql_flexible_server.pg.id
  start_ip_address = split("/", var.allowed_ip_ranges[count.index])[0]
  end_ip_address   = var.allowed_ip_ranges[count.index]
}

# Create the application database
resource "azurerm_postgresql_flexible_server_database" "appdb" {
  name      = "tnw_db"
  server_id = azurerm_postgresql_flexible_server.pg.id
}

// Optional data lookup for external storage account (tf-aks-storage)
data "azurerm_storage_account" "tfstate" {
  count               = var.storage_account_name != "" ? 1 : 0
  name                = var.storage_account_name
  resource_group_name = var.storage_account_rg
}
