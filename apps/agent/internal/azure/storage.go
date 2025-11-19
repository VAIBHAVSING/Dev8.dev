package azure

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azfile/service"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azfile/share"
)

// StorageClient provides Azure Files operations
type StorageClient struct {
	serviceClient *service.Client
	accountName   string
	accountKey    string
}

// NewStorageClient creates a new Azure Files storage client
func NewStorageClient(accountName, accountKey string) (*StorageClient, error) {
	// Create service client using account name and key
	serviceURL := fmt.Sprintf("https://%s.file.core.windows.net/", accountName)

	// Create shared key credential
	credential, err := service.NewSharedKeyCredential(accountName, accountKey)
	if err != nil {
		return nil, fmt.Errorf("failed to create shared key credential: %w", err)
	}

	// Create service client
	client, err := service.NewClientWithSharedKeyCredential(serviceURL, credential, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create service client: %w", err)
	}

	return &StorageClient{
		serviceClient: client,
		accountName:   accountName,
		accountKey:    accountKey,
	}, nil
}

// CreateFileShare creates a new Azure File share
func (s *StorageClient) CreateFileShare(ctx context.Context, shareName string, quotaGB int32) error {
	shareClient := s.serviceClient.NewShareClient(shareName)

	_, err := shareClient.Create(ctx, &share.CreateOptions{
		Quota: &quotaGB,
	})
	if err != nil {
		return fmt.Errorf("failed to create file share: %w", err)
	}

	return nil
}

// DeleteFileShare deletes an Azure File share
func (s *StorageClient) DeleteFileShare(ctx context.Context, shareName string) error {
	shareClient := s.serviceClient.NewShareClient(shareName)

	_, err := shareClient.Delete(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to delete file share: %w", err)
	}

	return nil
}

// FileShareExists checks if a file share exists
func (s *StorageClient) FileShareExists(ctx context.Context, shareName string) (bool, error) {
	shareClient := s.serviceClient.NewShareClient(shareName)

	_, err := shareClient.GetProperties(ctx, nil)
	if err != nil {
		// Check if error is "share not found"
		if isNotFoundError(err) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file share existence: %w", err)
	}

	return true, nil
}

// GetFileShareProperties gets the properties of a file share
func (s *StorageClient) GetFileShareProperties(ctx context.Context, shareName string) (map[string]interface{}, error) {
	shareClient := s.serviceClient.NewShareClient(shareName)

	resp, err := shareClient.GetProperties(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get file share properties: %w", err)
	}

	properties := map[string]interface{}{
		"quota":        resp.Quota,
		"lastModified": resp.LastModified,
	}

	return properties, nil
}

// isNotFoundError checks if the error is a "not found" error
func isNotFoundError(err error) bool {
	if err == nil {
		return false
	}

	// Check if error is an Azure ResponseError with 404 status code
	var respErr *azcore.ResponseError
	if errors.As(err, &respErr) {
		return respErr.StatusCode == http.StatusNotFound
	}

	// Fallback: case-insensitive substring match for non-azcore errors
	errMsg := strings.ToLower(err.Error())
	return strings.Contains(errMsg, "not found") || strings.Contains(errMsg, "404")
}
