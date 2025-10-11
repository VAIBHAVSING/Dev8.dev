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

// Environment represents a cloud development environment
type Environment struct {
	ID                  string            `json:"id"`
	UserID              string            `json:"userId"`
	Name                string            `json:"name"`
	Status              EnvironmentStatus `json:"status"`
	CloudProvider       CloudProvider     `json:"cloudProvider"`
	CloudRegion         string            `json:"cloudRegion"`
	ACIContainerGroupID string            `json:"aciContainerGroupId,omitempty"`
	ACIPublicIP         string            `json:"aciPublicIp,omitempty"`
	AzureFileShareName  string            `json:"azureFileShareName,omitempty"`
	VSCodeURL           string            `json:"vsCodeUrl,omitempty"`
	CPUCores            int               `json:"cpuCores"`
	MemoryGB            int               `json:"memoryGB"`
	StorageGB           int               `json:"storageGB"`
	BaseImage           string            `json:"baseImage"`
	CreatedAt           time.Time         `json:"createdAt"`
	UpdatedAt           time.Time         `json:"updatedAt"`
	LastAccessedAt      time.Time         `json:"lastAccessedAt"`
}

// CreateEnvironmentRequest represents a request to create a new environment
type CreateEnvironmentRequest struct {
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
	if r.Name == "" {
		return ErrInvalidRequest("name is required")
	}
	if r.CloudRegion == "" {
		return ErrInvalidRequest("cloudRegion is required")
	}
	if r.CPUCores < 1 || r.CPUCores > 64 {
		return ErrInvalidRequest("cpuCores must be between 1 and 64")
	}
	if r.MemoryGB < 1 || r.MemoryGB > 256 {
		return ErrInvalidRequest("memoryGB must be between 1 and 256")
	}
	if r.StorageGB < 10 || r.StorageGB > 2000 {
		return ErrInvalidRequest("storageGB must be between 10 and 2000")
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
