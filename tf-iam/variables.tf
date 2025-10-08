variable "resource_group_name" {
  type        = string
  description = "Resource group where the UAMI will be created"
}

variable "location" {
  description = "Azure location / region"
  type        = string
  default     = "eastus"
}

variable "identity_name" {
  description = "Name of the user-assigned managed identity"
  type        = string
  default     = "tnw-uami"
}

variable "acr_resource_id" {
  description = "Optional: ACR resource id to grant AcrPull to the UAMI (leave empty to skip role assignment)"
  type        = string
  default     = ""
}
