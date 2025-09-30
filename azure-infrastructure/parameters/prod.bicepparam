// Production Environment Parameters
using '../main.bicep'

// Environment Configuration
param environment = 'prod'
param location = 'eastus'

// Storage Configuration
param storageSku = 'Standard_GRS'  // Geo-redundant for production

// Container Registry Configuration
param registrySku = 'Standard'  // Standard tier for production
param registryAdminEnabled = false  // Use RBAC in production

// Cost Management
param budgetAmount = 500  // Higher budget for production

// Tags
param tags = {
  Project: 'Dev8'
  Environment: 'Production'
  ManagedBy: 'Bicep'
  CostCenter: 'Production'
}
