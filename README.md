# 🏫 Tuition Centre CMS (Capstone Project)

### ⚙️ Overview

This repository hosts a **containerized Tuition Centre Content Management System (CMS)** — developed as part of my DevOps capstone project.

It demonstrates both **local development using Docker Compose** and a **production-grade Azure Kubernetes Service (AKS)** deployment pipeline built with **Terraform, GitHub Actions, and Helm**.

> 🔍 If you’re reviewing this for DevOps, CI/CD, or Cloud Engineering skills — start with the AKS version below.

---

### 🚀 Quick Links

| Environment                       | Description                                                                                          | Link                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 🧩 **Local Dev (Docker Compose)** | Run the app locally on your machine with PostgreSQL (persistent volume). Ideal for testing the app logic. | 👉 [README_local.md setup](README_local.md)                                   |
| ☁️ **Cloud DevOps (ACR + AKS)**  | Full-scale DevOps workflow — Terraform-provisioned infrastructure, GitHub Actions CI/CD, Helm deployment, and Azure Managed Identity security. | 👉 [**View the full AKS DevOps setup → README_ACR_AKS.md**](README_ACR_AKS.md) |

> ⚡ The AKS version showcases:
>
> - Infrastructure as Code (Terraform)
> - CI/CD automation via GitHub Actions
> - Secure image pull using Managed Identity
> - Private Endpoint networking (PostgreSQL)
> - Scalable multi-node AKS design for up to 100k users

---

### 📘 Project Summary

| Category                 | Tech Used                          |
| ------------------------ | ---------------------------------- |
| **App Layer**            | Next.js containerized CMS          |
| **Local Runtime**        | Docker Compose (with PostgreSQL)   |
| **Cloud Deployment**     | AKS + ACR + Terraform + Helm       |
| **CI/CD Pipeline**       | GitHub Actions                     |
| **Security**             | UAMI, Private Endpoints            |
| **Monitoring (Planned)** | Azure Monitor, Prometheus, Grafana |

---

### My Role

- Designed and authored all Terraform modules (ACR, AKS, IAM, PostgreSQL, storage backend).
- Implemented CI/CD workflow with GitHub Actions and Helm deployment automation.
- Configured AKS Managed Identity for secure image pulls (AcrPull role).
- Troubleshot networking and DNS issues for Private Endpoint integration.
- Produced detailed documentation to reflect **enterprise DevSecOps practice**