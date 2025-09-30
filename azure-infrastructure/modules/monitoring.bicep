// Monitoring and Cost Management Bicep Module
// Sets up budget alerts and cost tracking

targetScope = 'resourceGroup'

@description('Budget name')
param budgetName string

@description('Monthly budget amount in USD')
param budgetAmount int

@description('Resource group ID for the budget scope')
param resourceGroupId string

@description('Budget start date (YYYY-MM-DD format)')
param startDate string = utcNow('yyyy-MM-01')

@description('Budget end date (YYYY-MM-DD format, must be at least 1 month after start)')
param endDate string = dateTimeAdd(utcNow('yyyy-MM-01'), 'P1Y', 'yyyy-MM-dd')

@description('Email addresses for budget alerts')
param contactEmails array = []

@description('Alert thresholds (percentage of budget)')
param alertThresholds array = [
  50
  75
  90
  100
]

// Budget Resource
resource budget 'Microsoft.Consumption/budgets@2023-05-01' = {
  name: budgetName
  properties: {
    timePeriod: {
      startDate: startDate
      endDate: endDate
    }
    timeGrain: 'Monthly'
    amount: budgetAmount
    category: 'Cost'
    notifications: {
      Alert50: {
        enabled: true
        operator: 'GreaterThan'
        threshold: alertThresholds[0]
        contactEmails: contactEmails
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
      Alert75: {
        enabled: true
        operator: 'GreaterThan'
        threshold: alertThresholds[1]
        contactEmails: contactEmails
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
      Alert90: {
        enabled: true
        operator: 'GreaterThan'
        threshold: alertThresholds[2]
        contactEmails: contactEmails
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Actual'
      }
      Alert100: {
        enabled: true
        operator: 'GreaterThan'
        threshold: alertThresholds[3]
        contactEmails: contactEmails
        contactRoles: [
          'Owner'
          'Contributor'
        ]
        thresholdType: 'Forecasted'
      }
    }
    filter: {
      dimensions: {
        name: 'ResourceGroupName'
        operator: 'In'
        values: [
          last(split(resourceGroupId, '/'))
        ]
      }
    }
  }
}

// Outputs
output budgetName string = budget.name
output budgetId string = budget.id
output budgetAmount int = budgetAmount
output budgetStartDate string = startDate
output budgetEndDate string = endDate
