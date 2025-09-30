# Azure Security Best Practices

Security guidelines and best practices for Dev8.dev Azure infrastructure.

## Table of Contents

- [Security Principles](#security-principles)
- [Authentication and Authorization](#authentication-and-authorization)
- [Credential Management](#credential-management)
- [Network Security](#network-security)
- [Data Protection](#data-protection)
- [Monitoring and Auditing](#monitoring-and-auditing)
- [Compliance](#compliance)
- [Incident Response](#incident-response)

## Security Principles

### Defense in Depth

Apply multiple layers of security:
1. **Identity & Access:** RBAC, service principals
2. **Network:** Private endpoints, NSGs
3. **Data:** Encryption at rest and in transit
4. **Application:** Secure coding practices
5. **Monitoring:** Logging and alerting

### Least Privilege

Grant minimum necessary permissions:
- Use specific roles instead of Owner
- Scope permissions to resource groups
- Regular permission audits

### Zero Trust

Never trust, always verify:
- Authenticate every request
- Encrypt all communications
- Validate input data
- Monitor all activities

## Authentication and Authorization

### Service Principal Best Practices

**1. Use Service Principals for Automation**

✅ **Do:**
```bash
# Create service principal with limited scope
az ad sp create-for-rbac \
  --name dev8-mvp-sp \
  --role Contributor \
  --scopes /subscriptions/$SUB_ID/resourceGroups/$RG_NAME
```

❌ **Don't:**
- Use personal accounts for automation
- Grant Owner role unless absolutely necessary
- Share service principal credentials

**2. Rotate Credentials Regularly**

```bash
# Reset service principal credentials every 90 days
az ad sp credential reset \
  --id $CLIENT_ID \
  --years 1
```

**3. Use Managed Identities When Possible**

For production, prefer managed identities:
```bicep
resource vmIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'dev8-vm-identity'
  location: location
}
```

### RBAC (Role-Based Access Control)

**Built-in Roles:**

| Role | Use Case | Permissions |
|------|----------|-------------|
| Contributor | Development | Create/modify/delete resources (except IAM) |
| Reader | Monitoring | View resources only |
| Storage Blob Data Contributor | App access to storage | Read/write/delete blobs |
| AcrPush | CI/CD pipelines | Push images to registry |
| AcrPull | Container deployment | Pull images from registry |

**Custom Roles:**

For fine-grained control:
```json
{
  "Name": "Dev8 Container Operator",
  "IsCustom": true,
  "Description": "Can manage containers but not other resources",
  "Actions": [
    "Microsoft.ContainerInstance/containerGroups/*",
    "Microsoft.Storage/storageAccounts/fileServices/fileshares/*"
  ],
  "NotActions": [],
  "DataActions": [],
  "AssignableScopes": [
    "/subscriptions/{subscription-id}/resourceGroups/dev8-mvp-rg"
  ]
}
```

### Multi-Factor Authentication (MFA)

**Enable MFA for all users:**
1. Azure Portal → Azure Active Directory
2. Security → MFA
3. Enable for all users

**Conditional Access Policies:**
- Require MFA for Azure Portal access
- Block access from unknown locations
- Require compliant devices

## Credential Management

### Storing Credentials Securely

**1. Never Commit Secrets to Git**

✅ **Correct approach:**
```bash
# .gitignore
.env
.env.azure
azure-credentials.json
*.key
*.pem
```

❌ **Never do:**
- Commit credentials to version control
- Push secrets to public repositories
- Store passwords in code comments

**2. Use Environment Variables**

```bash
# Load from secure file
export $(grep -v '^#' .env.azure | xargs)

# Use in application
echo $AZURE_CLIENT_ID
```

**3. Azure Key Vault (Production)**

For production, use Azure Key Vault:
```bash
# Store secret
az keyvault secret set \
  --vault-name dev8-mvp-vault \
  --name storage-key \
  --value $STORAGE_KEY

# Retrieve secret
az keyvault secret show \
  --vault-name dev8-mvp-vault \
  --name storage-key \
  --query value -o tsv
```

### Credential Rotation

**Regular Rotation Schedule:**
- Service principals: Every 90 days
- Storage account keys: Every 180 days
- Container registry passwords: Every 90 days

**Rotation Process:**
```bash
# 1. Create new credential
az ad sp credential reset --id $CLIENT_ID

# 2. Update applications with new credential
# (Use blue-green deployment)

# 3. Verify new credential works

# 4. Delete old credential (after grace period)
```

### File Permissions

**Protect sensitive files:**
```bash
# Restrict access to owner only
chmod 600 .env.azure
chmod 600 azure-credentials.json

# Verify
ls -la .env.azure
# -rw------- (600)
```

## Network Security

### Network Isolation

**1. Private Endpoints (Production)**

```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-04-01' = {
  name: 'storage-private-endpoint'
  location: location
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: 'storage-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['file']
        }
      }
    ]
  }
}
```

**2. Firewall Rules**

```bash
# Restrict storage account access
az storage account update \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP \
  --default-action Deny

# Allow specific IPs
az storage account network-rule add \
  --account-name $STORAGE_NAME \
  --ip-address 1.2.3.4
```

**3. Network Security Groups (NSGs)**

For VNet-integrated deployments:
```bicep
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-04-01' = {
  name: 'dev8-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          access: 'Allow'
          direction: 'Inbound'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}
```

### TLS/SSL Configuration

**1. Enforce HTTPS**

```bash
# Storage account
az storage account update \
  --name $STORAGE_NAME \
  --https-only true \
  --min-tls-version TLS1_2

# Container registry
az acr update \
  --name $REGISTRY_NAME \
  --public-network-enabled false  # For production
```

**2. Certificate Management**

For custom domains:
```bash
# Use Azure Front Door or Application Gateway
# Automatically manages SSL certificates via Let's Encrypt
```

## Data Protection

### Encryption at Rest

**Storage Account:**
- Enabled by default with Microsoft-managed keys
- Option to use customer-managed keys (CMK)

```bash
# Verify encryption
az storage account show \
  --name $STORAGE_NAME \
  --query encryption
```

**Customer-Managed Keys (Production):**
```bicep
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' existing = {
  name: 'dev8-keyvault'
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  properties: {
    encryption: {
      services: {
        blob: { enabled: true }
        file: { enabled: true }
      }
      keySource: 'Microsoft.Keyvault'
      keyvaultproperties: {
        keyname: 'storage-encryption-key'
        keyvaulturi: keyVault.properties.vaultUri
      }
    }
  }
}
```

### Encryption in Transit

**Always use HTTPS:**
```go
// Go backend - enforce HTTPS
if !strings.HasPrefix(req.URL.Scheme, "https") {
    http.Redirect(w, req, "https://"+req.Host+req.URL.Path, http.StatusMovedPermanently)
}
```

**Azure Files SMB 3.0:**
- Encryption in transit enabled by default
- SMB 3.0 protocol with AES-256 encryption

### Data Retention and Deletion

**Soft Delete:**
```bash
# Enable soft delete for blobs (7-day retention)
az storage account blob-service-properties update \
  --account-name $STORAGE_NAME \
  --enable-delete-retention true \
  --delete-retention-days 7
```

**Secure Deletion:**
```bash
# Permanently delete (after soft delete period)
az storage blob delete-batch \
  --account-name $STORAGE_NAME \
  --source container-name \
  --pattern "*"
```

## Monitoring and Auditing

### Activity Logging

**Enable diagnostic settings:**
```bash
# Storage account diagnostics
az monitor diagnostic-settings create \
  --name storage-diagnostics \
  --resource $STORAGE_ID \
  --logs '[{"category":"StorageRead","enabled":true}]' \
  --metrics '[{"category":"Transaction","enabled":true}]' \
  --workspace $LOG_ANALYTICS_ID
```

**Key events to monitor:**
- Service principal usage
- Resource creation/deletion
- Permission changes
- Failed authentication attempts
- Unusual data access patterns

### Azure Security Center

**Enable Security Center:**
1. Azure Portal → Security Center
2. Enable Azure Defender for:
   - Storage accounts
   - Container registries
   - Resource Manager

**Security Score:**
- Monitor security score regularly
- Address high-priority recommendations
- Target: 80%+ security score

### Alert Rules

**Critical alerts:**
```bash
# Alert on service principal usage from new IP
az monitor metrics alert create \
  --name sp-new-ip-alert \
  --resource-group $RESOURCE_GROUP \
  --condition "count authentication_events where ip not in known_ips > 0" \
  --action email-admin
```

## Compliance

### Standards and Certifications

**Azure Compliance:**
- SOC 2 Type II
- ISO 27001
- GDPR compliant
- HIPAA compliant (with BAA)

**Data Residency:**
```bash
# Ensure data stays in specific region
az group create --name dev8-mvp-rg --location eastus

# Verify
az group show --name dev8-mvp-rg --query location
```

### Data Classification

**Classify your data:**
- **Public:** Documentation, marketing materials
- **Internal:** Development code, non-sensitive data
- **Confidential:** User code, credentials
- **Restricted:** PII, payment information

**Apply tags:**
```bash
az resource tag \
  --tags DataClassification=Confidential \
  --ids $STORAGE_ID
```

### Audit Trail

**Maintain audit logs:**
- Azure Activity Logs (90 days)
- Archive to Storage Account (long-term)
- Export to SIEM (Security Information and Event Management)

```bash
# Export activity logs
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --start-time 2024-01-01 \
  --end-time 2024-12-31 \
  --output json > audit-trail-2024.json
```

## Incident Response

### Security Incident Plan

**1. Detection**
- Monitor security alerts
- Review activity logs
- User reports

**2. Containment**
```bash
# Immediately revoke compromised credentials
az ad sp credential reset --id $CLIENT_ID

# Block suspicious IP
az storage account network-rule add \
  --account-name $STORAGE_NAME \
  --action Deny \
  --ip-address $SUSPICIOUS_IP
```

**3. Investigation**
```bash
# Review activity logs
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --caller $COMPROMISED_PRINCIPAL \
  --start-time $INCIDENT_TIME

# Check resource changes
az resource list \
  --resource-group $RESOURCE_GROUP \
  --query "[?changedTime>'$INCIDENT_TIME']"
```

**4. Recovery**
- Restore from backups if needed
- Reset all affected credentials
- Apply security patches

**5. Post-Incident**
- Document incident
- Update security policies
- Improve detection mechanisms

### Contact Information

**Security Issues:**
- Email: security@dev8.dev
- Emergency: Use Azure Support Portal

**Azure Security Response:**
- Azure Security Center
- Microsoft Security Response Center (MSRC)

## Security Checklist

### MVP Security (Must-Have)

- [ ] Service principal with scoped permissions
- [ ] Credentials stored securely (not in git)
- [ ] HTTPS enforced on all resources
- [ ] TLS 1.2 minimum
- [ ] Activity logging enabled
- [ ] Budget alerts configured
- [ ] MFA enabled for admin accounts
- [ ] .gitignore properly configured

### Production Security (Recommended)

- [ ] Azure Key Vault for secrets
- [ ] Private endpoints for storage
- [ ] Network security groups configured
- [ ] Azure Defender enabled
- [ ] Customer-managed encryption keys
- [ ] Regular credential rotation (automated)
- [ ] Incident response plan documented
- [ ] Security audit completed
- [ ] Compliance review passed
- [ ] Backup and disaster recovery tested

### Enterprise Security (Advanced)

- [ ] Azure Sentinel for SIEM
- [ ] Just-in-Time (JIT) access
- [ ] Azure Policy for governance
- [ ] Privileged Identity Management (PIM)
- [ ] Azure DDoS Protection
- [ ] Geo-redundant backups
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] Security training for team
- [ ] SOC 2 Type II certification

## Resources

- [Azure Security Baseline](https://docs.microsoft.com/security/benchmark/azure/)
- [Azure Security Center](https://docs.microsoft.com/azure/security-center/)
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Azure Foundations Benchmark](https://www.cisecurity.org/benchmark/azure)

---

**Last Updated:** 2024
**Security Level:** MVP with Production-Ready Options
**Compliance:** SOC 2, ISO 27001, GDPR
