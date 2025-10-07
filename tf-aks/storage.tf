/*
Demo: Storage/volume examples for AKS (commented out)

Contains examples of StorageClass for Azure Disk and Azure Files and PVC examples.
*/

/*
# Azure Disk StorageClass (dynamic provisioning via CSI)
# Recommended for single-writer workloads (e.g., database replica)

resource "kubernetes_storage_class" "azure_disk" {
  metadata {
    name = "azure-disk-csi"
  }
  provisioner = "disk.csi.azure.com"
  parameters = {
    skuName = "Standard_LRS"
  }
}

# Sample PVC for Azure Disk
resource "kubernetes_persistent_volume_claim" "db" {
  metadata {
    name = "db-pvc"
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "50Gi"
      }
    }
    storage_class_name = "azure-disk-csi"
  }
}

# Azure Files StorageClass (shared access: ReadWriteMany)
resource "kubernetes_storage_class" "azure_files" {
  metadata { name = "azure-files-csi" }
  provisioner = "file.csi.azure.com"
  parameters = {
    skuName = "Standard_LRS"
  }
}

# Sample PVC for shared files
resource "kubernetes_persistent_volume_claim" "shared" {
  metadata { name = "shared-pvc" }
  spec {
    access_modes = ["ReadWriteMany"]
    resources { requests = { storage = "100Gi" } }
    storage_class_name = "azure-files-csi"
  }
}
*/
