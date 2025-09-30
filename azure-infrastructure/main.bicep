// Main Bicep template for Dev8.dev Azure Infrastructure
// This template orchestrates the deployment of all required resources

targetScope = 'resourceGroup'

@description('The environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('The Azure region for all resources')
param location string = resourceGroup().location

@description('Random suffix for globally unique resource names')
param randomSuffix string = uniqueString(resourceGroup().id)

@description('Tags to apply to all resources')
param tags object = {
  Project: 'Dev8'
  Environment: environment
  ManagedBy: 'Bicep'
}

@description('Storage account SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_RAGRS'
])
param storageSku string = 'Standard_LRS'

@description('Container Registry SKU')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param registrySku string = 'Basic'

@description('Enable admin user for Container Registry')
param registryAdminEnabled bool = true

@description('Monthly budget amount in USD')
param budgetAmount int = 50

// Deploy Storage Account module
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    storageAccountName: 'dev8${environment}storage${randomSuffix}'
    location: location
    sku: storageSku
    tags: tags
  }
}

// Deploy Container Registry module
module registry 'modules/registry.bicep' = {
  name: 'registry-deployment'
  params: {
    registryName: 'dev8${environment}registry${randomSuffix}'
    location: location
    sku: registrySku
    adminUserEnabled: registryAdminEnabled
    tags: tags
  }
}

// Deploy Monitoring module
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  params: {
    budgetName: 'dev8-${environment}-budget'
    budgetAmount: budgetAmount
    resourceGroupId: resourceGroup().id
  }
}

// Outputs
output storageAccountName string = storage.outputs.storageAccountName
output storageAccountId string = storage.outputs.storageAccountId
output storageConnectionString string = storage.outputs.connectionString
output storagePrimaryKey string = storage.outputs.primaryKey

output registryName string = registry.outputs.registryName
output registryId string = registry.outputs.registryId
output registryLoginServer string = registry.outputs.loginServer
output registryAdminUsername string = registry.outputs.adminUsername
output registryAdminPassword string = registry.outputs.adminPassword

output resourceGroupName string = resourceGroup().name
output resourceGroupLocation string = resourceGroup().location
