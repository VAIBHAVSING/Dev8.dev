package models

import "time"

// EnvironmentStatus represents the current status of an environment
type EnvironmentStatus string

const (
	StatusCreating EnvironmentStatus = "CREATING"
	StatusStarting EnvironmentStatus = "STARTING"
	StatusRunning  EnvironmentStatus = "RUNNING"
	StatusStopping EnvironmentStatus = "STOPPING"
	StatusStopped  EnvironmentStatus = "STOPPED"
	StatusError    EnvironmentStatus = "ERROR"
	StatusDeleting EnvironmentStatus = "DELETING"
)

// CloudProvider represents supported cloud providers
type CloudProvider string

const (
	ProviderAzure CloudProvider = "AZURE"
	ProviderAWS   CloudProvider = "AWS"
	ProviderGCP   CloudProvider = "GCP"
)

// ConnectionURLs contains all connection endpoints for the workspace
type ConnectionURLs struct {
	SSHURL             string `json:"sshUrl"`             // ssh://user@ws-{uuid}.region.azurecontainer.io:2222
	VSCodeWebURL       string `json:"vscodeWebUrl"`       // https://ws-{uuid}.region.azurecontainer.io:8080
	VSCodeDesktopURL   string `json:"vscodeDesktopUrl"`   // vscode-remote://ssh-remote+user@ws-{uuid}...:2222/workspace
	SupervisorURL      string `json:"supervisorUrl"`      // http://ws-{uuid}.region.azurecontainer.io:9000
	CodeServerPassword string `json:"codeServerPassword"` // Generated password for VS Code auth
}

// Environment represents a cloud development environment
type Environment struct {
	ID     string            `json:"id"` // Same as WorkspaceID (UUID from DB)
	UserID string            `json:"userId"`
	Name   string            `json:"name"`
	Status EnvironmentStatus `json:"status"`

	// Cloud Configuration
	CloudProvider CloudProvider `json:"cloudProvider"`
	CloudRegion   string        `json:"cloudRegion"`

	// Resources
	CPUCores  int    `json:"cpuCores"`
	MemoryGB  int    `json:"memoryGB"`
	StorageGB int    `json:"storageGB"`
	BaseImage string `json:"baseImage"`

	// Azure Resource Identifiers (all based on UUID)
	AzureResourceGroup  string `json:"azureResourceGroup"`  // e.g., "dev8-eastus-rg"
	AzureContainerGroup string `json:"azureContainerGroup"` // e.g., "aci-clxxx-yyyy-zzzz"
	AzureFileShare      string `json:"azureFileShare"`      // e.g., "fs-clxxx-yyyy-zzzz"
	AzureFQDN           string `json:"azureFqdn"`           // e.g., "ws-clxxx-yyyy-zzzz.eastus.azurecontainer.io"

	// Connection Information (all contain UUID)
	ConnectionURLs ConnectionURLs `json:"connectionUrls"`

	// Timestamps
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	LastAccessedAt time.Time `json:"lastAccessedAt,omitempty"`
}

// CreateEnvironmentRequest represents a request to create a new environment
type CreateEnvironmentRequest struct {
	// CRITICAL: WorkspaceID is the UUID from Next.js database (Prisma cuid)
	// This UUID is used for all Azure resource naming
	WorkspaceID string `json:"workspaceId"` // e.g., "clxxx-yyyy-zzzz"

	UserID        string        `json:"userId"`
	Name          string        `json:"name"`
	CloudProvider CloudProvider `json:"cloudProvider"`
	CloudRegion   string        `json:"cloudRegion"`
	CPUCores      int           `json:"cpuCores"`
	MemoryGB      int           `json:"memoryGB"`
	StorageGB     int           `json:"storageGB"`
	BaseImage     string        `json:"baseImage"`
}

// UpdateEnvironmentRequest represents a request to update an environment
type UpdateEnvironmentRequest struct {
	Name   string `json:"name,omitempty"`
	Status string `json:"status,omitempty"`
}

// EnvironmentResponse represents the response for environment operations
type EnvironmentResponse struct {
	Environment *Environment `json:"environment"`
	Message     string       `json:"message,omitempty"`
	Error       string       `json:"error,omitempty"`
}

// EnvironmentListResponse represents the response for listing environments
type EnvironmentListResponse struct {
	Environments []Environment `json:"environments"`
	Total        int           `json:"total"`
	Page         int           `json:"page,omitempty"`
	PageSize     int           `json:"pageSize,omitempty"`
}

// ActivitySnapshot captures active connection counts and recency data.
type ActivitySnapshot struct {
	LastIDEActivity time.Time `json:"lastIDEActivity"`
	LastSSHActivity time.Time `json:"lastSSHActivity"`
	ActiveIDE       int       `json:"activeIDEConnections"`
	ActiveSSH       int       `json:"activeSSHConnections"`
}

// ActivityReport represents a workspace supervisor activity update.
type ActivityReport struct {
	EnvironmentID string           `json:"environmentId"`
	Snapshot      ActivitySnapshot `json:"snapshot"`
	Timestamp     time.Time        `json:"timestamp"`
}

// Normalize ensures the report contains consistent identifiers and timestamps.
func (r *ActivityReport) Normalize(pathEnvironmentID string) error {
	if r == nil {
		return ErrInvalidRequest("activity payload is required")
	}

	if r.EnvironmentID == "" {
		r.EnvironmentID = pathEnvironmentID
	}

	if pathEnvironmentID != "" && r.EnvironmentID != pathEnvironmentID {
		return ErrInvalidRequest("environmentId in payload does not match route parameter")
	}

	if r.EnvironmentID == "" {
		return ErrInvalidRequest("environmentId is required")
	}

	if r.Timestamp.IsZero() {
		r.Timestamp = time.Now().UTC()
	}

	return nil
}

// Validate validates the create environment request
func (r *CreateEnvironmentRequest) Validate() error {
	if r.WorkspaceID == "" {
		return ErrInvalidRequest("workspaceId is required (UUID from database)")
	}

	// Validate UUID format (basic check)
	if len(r.WorkspaceID) < 10 {
		return ErrInvalidRequest("workspaceId must be a valid UUID")
	}

	if r.Name == "" {
		return ErrInvalidRequest("name is required")
	}
	if r.CloudRegion == "" {
		return ErrInvalidRequest("cloudRegion is required")
	}
	if r.CPUCores < 1 || r.CPUCores > 4 {
		return ErrInvalidRequest("cpuCores must be between 1 and 4")
	}
	if r.MemoryGB < 2 || r.MemoryGB > 16 {
		return ErrInvalidRequest("memoryGB must be between 2 and 16")
	}
	if r.StorageGB < 10 || r.StorageGB > 100 {
		return ErrInvalidRequest("storageGB must be between 10 and 100")
	}
	if r.BaseImage == "" {
		r.BaseImage = "node" // Default to Node.js
	}
	return nil
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    string `json:"code,omitempty"`
}

// Custom error types
type AppError struct {
	Message string
	Code    string
}

func (e *AppError) Error() string {
	return e.Message
}

// Error constructors
func ErrInvalidRequest(message string) error {
	return &AppError{Message: message, Code: "INVALID_REQUEST"}
}

func ErrNotFound(message string) error {
	return &AppError{Message: message, Code: "NOT_FOUND"}
}

func ErrInternalServer(message string) error {
	return &AppError{Message: message, Code: "INTERNAL_SERVER_ERROR"}
}

func ErrUnauthorized(message string) error {
	return &AppError{Message: message, Code: "UNAUTHORIZED"}
}
