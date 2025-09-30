// Azure Container Instance (ACI) Bicep Module
// Template for deploying VS Code server containers

@description('Container group name')
param containerGroupName string

@description('Azure region for the container instance')
param location string

@description('Container image (from Azure Container Registry)')
param containerImage string

@description('Number of CPU cores (0.5, 1, 2, 4)')
@allowed([
  '0.5'
  '1'
  '2'
  '4'
])
param cpuCores string = '1'

@description('Memory in GB (1, 2, 4, 8, 16)')
@allowed([
  '1'
  '2'
  '4'
  '8'
  '16'
])
param memoryInGb string = '2'

@description('Container registry login server')
param registryLoginServer string

@description('Container registry username')
@secure()
param registryUsername string

@description('Container registry password')
@secure()
param registryPassword string

@description('Azure Files share name for workspace persistence')
param fileShareName string

@description('Storage account name')
param storageAccountName string

@description('Storage account key')
@secure()
param storageAccountKey string

@description('Environment variables for the container')
param environmentVariables array = []

@description('Tags for the container instance')
param tags object = {}

// Container Group Resource
resource containerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: containerGroupName
  location: location
  tags: tags
  properties: {
    containers: [
      {
        name: 'vscode-server'
        properties: {
          image: containerImage
          resources: {
            requests: {
              cpu: json(cpuCores)
              memoryInGB: json(memoryInGb)
            }
          }
          ports: [
            {
              port: 8080
              protocol: 'TCP'
            }
          ]
          environmentVariables: environmentVariables
          volumeMounts: [
            {
              name: 'workspace'
              mountPath: '/home/coder/workspace'
              readOnly: false
            }
          ]
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'OnFailure'
    ipAddress: {
      type: 'Public'
      ports: [
        {
          port: 8080
          protocol: 'TCP'
        }
      ]
      dnsNameLabel: containerGroupName
    }
    imageRegistryCredentials: [
      {
        server: registryLoginServer
        username: registryUsername
        password: registryPassword
      }
    ]
    volumes: [
      {
        name: 'workspace'
        azureFile: {
          shareName: fileShareName
          storageAccountName: storageAccountName
          storageAccountKey: storageAccountKey
          readOnly: false
        }
      }
    ]
  }
}

// Outputs
output containerGroupName string = containerGroup.name
output containerGroupId string = containerGroup.id
output ipAddress string = containerGroup.properties.ipAddress.ip
output fqdn string = containerGroup.properties.ipAddress.fqdn
output provisioningState string = containerGroup.properties.provisioningState
