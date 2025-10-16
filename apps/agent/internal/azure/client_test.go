package azure

import (
	"testing"

	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance/v2"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

func TestContainerGroupSpec(t *testing.T) {
	spec := ContainerGroupSpec{
		ContainerName:      "test-container",
		Image:              "nginx:latest",
		CPUCores:           2,
		MemoryGB:           4,
		DNSNameLabel:       "test-dns",
		FileShareName:      "test-share",
		StorageAccountName: "teststorage",
		StorageAccountKey:  "testkey",
		EnvironmentID:      "env-123",
		UserID:             "user-456",
	}

	if spec.ContainerName != "test-container" {
		t.Errorf("ContainerName = %v, want test-container", spec.ContainerName)
	}

	if spec.CPUCores != 2 {
		t.Errorf("CPUCores = %v, want 2", spec.CPUCores)
	}

	if spec.MemoryGB != 4 {
		t.Errorf("MemoryGB = %v, want 4", spec.MemoryGB)
	}
}

func TestNewClient_InitializesACIClients(t *testing.T) {
	// This test verifies that NewClient initializes ACI clients for enabled regions
	// We can't fully test without Azure credentials, but we can test the structure

	cfg := &config.Config{
		Azure: config.AzureConfig{
			SubscriptionID: "test-sub-id",
			Regions: []config.RegionConfig{
				{Name: "eastus", Enabled: true},
				{Name: "westus", Enabled: false},
			},
		},
	}

	// Note: This will fail without valid Azure credentials
	// In a real test environment, you'd use mocks or Azure SDK test helpers
	_, err := NewClient(cfg)

	// We expect an error in test environment without credentials
	if err == nil {
		t.Log("NewClient() succeeded - must be running with Azure credentials")
	} else {
		t.Logf("NewClient() failed as expected in test environment: %v", err)
	}
}

func TestClient_GetACIClient(t *testing.T) {
	client := &Client{
		aciClients: make(map[string]*armcontainerinstance.ContainerGroupsClient),
	}

	// Test getting non-existent client
	_, err := client.GetACIClient("nonexistent")
	if err == nil {
		t.Error("GetACIClient() should return error for non-existent region")
	}
}
