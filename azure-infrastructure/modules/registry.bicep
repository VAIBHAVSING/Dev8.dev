// Container Registry Bicep Module
// Creates Azure Container Registry for storing VS Code server images

@description('Container registry name (must be globally unique, 5-50 alphanumeric)')
@minLength(5)
@maxLength(50)
param registryName string

@description('Azure region for the container registry')
param location string

@description('Container Registry SKU')
@allowed([
  'Basic'
  'Standard'
  'Premium'
])
param sku string = 'Basic'

@description('Enable admin user for the registry')
param adminUserEnabled bool = true

@description('Enable public network access')
param publicNetworkAccess bool = true

@description('Enable anonymous pull access')
param anonymousPullEnabled bool = false

@description('Tags for the container registry')
param tags object = {}

// Container Registry Resource
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: publicNetworkAccess ? 'Enabled' : 'Disabled'
    anonymousPullEnabled: anonymousPullEnabled
    dataEndpointEnabled: false
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      quarantinePolicy: {
        status: 'disabled'
      }
      trustPolicy: {
        type: 'Notary'
        status: 'disabled'
      }
      retentionPolicy: {
        days: 7
        status: 'disabled'
      }
    }
    encryption: {
      status: 'disabled'
    }
  }
}

// Outputs
output registryName string = containerRegistry.name
output registryId string = containerRegistry.id
output loginServer string = containerRegistry.properties.loginServer
output adminUsername string = adminUserEnabled ? containerRegistry.listCredentials().username : ''
output adminPassword string = adminUserEnabled ? containerRegistry.listCredentials().passwords[0].value : ''
