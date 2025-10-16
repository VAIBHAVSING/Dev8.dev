package azure

import (
	"context"
	"fmt"
	"net/http"
	"testing"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
)

func TestNewStorageClient(t *testing.T) {
	tests := []struct {
		name        string
		accountName string
		accountKey  string
		wantErr     bool
	}{
		{
			name:        "valid credentials",
			accountName: "testaccount",
			accountKey:  "dGVzdGtleQ==", // Base64 encoded "testkey"
			wantErr:     false,
		},
		{
			name:        "invalid key format",
			accountName: "testaccount",
			accountKey:  "invalid-key",
			wantErr:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := NewStorageClient(tt.accountName, tt.accountKey)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewStorageClient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && client == nil {
				t.Error("NewStorageClient() returned nil client without error")
			}

			if !tt.wantErr && client.accountName != tt.accountName {
				t.Errorf("NewStorageClient() accountName = %v, want %v", client.accountName, tt.accountName)
			}
		})
	}
}

func TestIsNotFoundError(t *testing.T) {
	tests := []struct {
		name string
		err  error
		want bool
	}{
		{
			name: "nil error",
			err:  nil,
			want: false,
		},
		{
			name: "404 response error",
			err:  &azcore.ResponseError{StatusCode: http.StatusNotFound},
			want: true,
		},
		{
			name: "500 response error",
			err:  &azcore.ResponseError{StatusCode: http.StatusInternalServerError},
			want: false,
		},
		{
			name: "not found string error",
			err:  fmt.Errorf("resource not found"),
			want: true,
		},
		{
			name: "404 string error",
			err:  fmt.Errorf("error 404: resource missing"),
			want: true,
		},
		{
			name: "other error",
			err:  fmt.Errorf("some other error"),
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isNotFoundError(tt.err); got != tt.want {
				t.Errorf("isNotFoundError() = %v, want %v", got, tt.want)
			}
		})
	}
}

// Mock test to verify method signatures
func TestStorageClientMethods(t *testing.T) {
	// Skip actual Azure calls in tests
	t.Skip("Skipping Azure storage tests - requires Azure credentials")

	client := &StorageClient{
		accountName: "test",
		accountKey:  "key",
	}

	ctx := context.Background()

	t.Run("CreateFileShare signature", func(t *testing.T) {
		// This test just verifies the method exists with correct signature
		_ = client.CreateFileShare(ctx, "test-share", 100)
	})

	t.Run("DeleteFileShare signature", func(t *testing.T) {
		_ = client.DeleteFileShare(ctx, "test-share")
	})

	t.Run("FileShareExists signature", func(t *testing.T) {
		_, _ = client.FileShareExists(ctx, "test-share")
	})

	t.Run("GetFileShareProperties signature", func(t *testing.T) {
		_, _ = client.GetFileShareProperties(ctx, "test-share")
	})
}
