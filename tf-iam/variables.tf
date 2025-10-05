variable "resource_group_name" {
  type        = string
  description = "Resource group for the identity"
}

variable "location" {
  type        = string
  description = "Azure location"
  default     = "eastasia"
}

variable "identity_name" {
  type        = string
  description = "User-assigned managed identity name"
  default     = "tnw-uami"
}

variable "acr_resource_id" {
  type        = string
  description = "Optional: ACR resource id to grant AcrPull to the UAMI"
  default     = ""
}
variable "resource_group_name" {
  description = "Resource group where the UAMI will be created"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastasia"
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
