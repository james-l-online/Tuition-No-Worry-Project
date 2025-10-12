# tf-postgres

This module provisions an Azure Database for PostgreSQL Flexible Server with a Private Endpoint and a Private DNS zone. It's intended for the secure demo described in the project README.

Required inputs:
- `resource_group_name` - target resource group
- `location` - Azure region (default `eastasia`)
- `server_name` - globally unique server name
- `vnet_id` - the VNet id to link for private DNS resolution
- `pe_subnet_id` - subnet id where the private endpoint will be placed

Outputs:
- `postgresql_database_url` (sensitive) - full connection string you can export into `DATABASE_URL` or create as a Kubernetes secret.
- `postgres_admin_password` (sensitive)

Notes:
- The module disables public network access and uses a private endpoint. Ensure your AKS cluster's subnet can resolve and reach the private DNS zone and endpoint.
- If you prefer public access for quick demos, set `public_network_access_enabled = true` in the resource and add firewall rules.
