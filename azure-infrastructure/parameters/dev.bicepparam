// Development Environment Parameters
using '../main.bicep'

// Environment Configuration
param environment = 'dev'
param location = 'eastus'

// Storage Configuration
param storageSku = 'Standard_LRS'

// Container Registry Configuration
param registrySku = 'Basic'
param registryAdminEnabled = true

// Cost Management
param budgetAmount = 50

// Tags
param tags = {
  Project: 'Dev8'
  Environment: 'Development'
  ManagedBy: 'Bicep'
  CostCenter: 'Development'
}
