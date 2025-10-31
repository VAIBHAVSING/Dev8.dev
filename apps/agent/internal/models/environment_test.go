package models

import (
	"testing"
	"time"
)

func TestCreateEnvironmentRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     CreateEnvironmentRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: CreateEnvironmentRequest{
				WorkspaceID: "550e8400-e29b-41d4-a716-446655440000",
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    4,
				StorageGB:   100,
				BaseImage:   "node",
			},
			wantErr: false,
		},
		{
			name: "missing name",
			req: CreateEnvironmentRequest{
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    4,
				StorageGB:   100,
			},
			wantErr: true,
		},
		{
			name: "missing region",
			req: CreateEnvironmentRequest{
				Name:      "test-env",
				CPUCores:  2,
				MemoryGB:  4,
				StorageGB: 100,
			},
			wantErr: true,
		},
		{
			name: "invalid CPU cores too low",
			req: CreateEnvironmentRequest{
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    0,
				MemoryGB:    4,
				StorageGB:   100,
			},
			wantErr: true,
		},
		{
			name: "invalid CPU cores too high",
			req: CreateEnvironmentRequest{
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    100,
				MemoryGB:    4,
				StorageGB:   100,
			},
			wantErr: true,
		},
		{
			name: "invalid memory too low",
			req: CreateEnvironmentRequest{
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    0,
				StorageGB:   100,
			},
			wantErr: true,
		},
		{
			name: "invalid storage too low",
			req: CreateEnvironmentRequest{
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    4,
				StorageGB:   5,
			},
			wantErr: true,
		},
		{
			name: "default base image",
			req: CreateEnvironmentRequest{
				WorkspaceID: "550e8400-e29b-41d4-a716-446655440000",
				Name:        "test-env",
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    4,
				StorageGB:   100,
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}

			// Check default base image is set
			if !tt.wantErr && tt.req.BaseImage == "" {
				if tt.req.BaseImage != "node" {
					t.Error("Validate() should set default base image to 'node'")
				}
			}
		})
	}
}

func TestActivityReport_Normalize(t *testing.T) {
	tests := []struct {
		name              string
		report            *ActivityReport
		pathEnvironmentID string
		wantErr           bool
	}{
		{
			name: "valid report with matching ID",
			report: &ActivityReport{
				EnvironmentID: "env-123",
				Snapshot:      ActivitySnapshot{ActiveIDE: 1},
			},
			pathEnvironmentID: "env-123",
			wantErr:           false,
		},
		{
			name: "missing environment ID in report",
			report: &ActivityReport{
				Snapshot: ActivitySnapshot{ActiveIDE: 1},
			},
			pathEnvironmentID: "env-123",
			wantErr:           false,
		},
		{
			name: "mismatched environment IDs",
			report: &ActivityReport{
				EnvironmentID: "env-456",
				Snapshot:      ActivitySnapshot{ActiveIDE: 1},
			},
			pathEnvironmentID: "env-123",
			wantErr:           true,
		},
		{
			name:              "nil report",
			report:            nil,
			pathEnvironmentID: "env-123",
			wantErr:           true,
		},
		{
			name: "missing both IDs",
			report: &ActivityReport{
				Snapshot: ActivitySnapshot{ActiveIDE: 1},
			},
			pathEnvironmentID: "",
			wantErr:           true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.report.Normalize(tt.pathEnvironmentID)
			if (err != nil) != tt.wantErr {
				t.Errorf("Normalize() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr && tt.report != nil {
				if tt.report.EnvironmentID == "" {
					t.Error("Normalize() should set EnvironmentID")
				}
				if tt.report.Timestamp.IsZero() {
					t.Error("Normalize() should set Timestamp")
				}
			}
		})
	}
}

func TestEnvironmentStatus(t *testing.T) {
	statuses := []EnvironmentStatus{
		StatusCreating,
		StatusStarting,
		StatusRunning,
		StatusStopping,
		StatusStopped,
		StatusError,
		StatusDeleting,
	}

	for _, status := range statuses {
		if status == "" {
			t.Errorf("Environment status should not be empty")
		}
	}
}

func TestCloudProvider(t *testing.T) {
	providers := []CloudProvider{
		ProviderAzure,
		ProviderAWS,
		ProviderGCP,
	}

	for _, provider := range providers {
		if provider == "" {
			t.Errorf("Cloud provider should not be empty")
		}
	}
}

func TestAppError(t *testing.T) {
	tests := []struct {
		name     string
		errFunc  func(string) error
		message  string
		wantCode string
	}{
		{
			name:     "invalid request error",
			errFunc:  ErrInvalidRequest,
			message:  "test error",
			wantCode: "INVALID_REQUEST",
		},
		{
			name:     "not found error",
			errFunc:  ErrNotFound,
			message:  "resource not found",
			wantCode: "NOT_FOUND",
		},
		{
			name:     "internal server error",
			errFunc:  ErrInternalServer,
			message:  "server error",
			wantCode: "INTERNAL_SERVER_ERROR",
		},
		{
			name:     "unauthorized error",
			errFunc:  ErrUnauthorized,
			message:  "unauthorized",
			wantCode: "UNAUTHORIZED",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.errFunc(tt.message)
			if err == nil {
				t.Error("Error constructor returned nil")
				return
			}

			appErr, ok := err.(*AppError)
			if !ok {
				t.Error("Error is not of type *AppError")
				return
			}

			if appErr.Code != tt.wantCode {
				t.Errorf("Error code = %v, want %v", appErr.Code, tt.wantCode)
			}

			if appErr.Message != tt.message {
				t.Errorf("Error message = %v, want %v", appErr.Message, tt.message)
			}

			if appErr.Error() != tt.message {
				t.Errorf("Error.Error() = %v, want %v", appErr.Error(), tt.message)
			}
		})
	}
}

func TestActivitySnapshot(t *testing.T) {
	now := time.Now()
	snapshot := ActivitySnapshot{
		LastIDEActivity: now,
		LastSSHActivity: now.Add(-5 * time.Minute),
		ActiveIDE:       2,
		ActiveSSH:       1,
	}

	if snapshot.ActiveIDE != 2 {
		t.Errorf("ActiveIDE = %v, want 2", snapshot.ActiveIDE)
	}

	if snapshot.ActiveSSH != 1 {
		t.Errorf("ActiveSSH = %v, want 1", snapshot.ActiveSSH)
	}

	if snapshot.LastIDEActivity.IsZero() {
		t.Error("LastIDEActivity should not be zero")
	}
}
