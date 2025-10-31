package config

import (
	"os"
	"testing"
)

func TestLoad(t *testing.T) {
	tests := []struct {
		name    string
		envVars map[string]string
		wantErr bool
	}{
		{
			name: "valid configuration",
			envVars: map[string]string{
				"AGENT_PORT":            "8080",
				"DATABASE_URL":          "postgres://localhost/test",
				"AZURE_SUBSCRIPTION_ID": "test-sub-id",
				"AZURE_DEFAULT_REGION":  "eastus",
			},
			wantErr: false,
		},
		{
			name: "missing database URL (now optional)",
			envVars: map[string]string{
				"AGENT_PORT":            "8080",
				"AZURE_SUBSCRIPTION_ID": "test-sub-id",
				"AZURE_DEFAULT_REGION":  "eastus",
			},
			wantErr: false, // DATABASE_URL is now optional for stateless agent
		},
		{
			name: "missing subscription ID",
			envVars: map[string]string{
				"AGENT_PORT":   "8080",
				"DATABASE_URL": "postgres://localhost/test",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Clear environment
			os.Clearenv()

			// Set test environment variables
			for k, v := range tt.envVars {
				os.Setenv(k, v)
			}

			cfg, err := Load()
			if (err != nil) != tt.wantErr {
				t.Errorf("Load() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && cfg == nil {
				t.Error("Load() returned nil config without error")
			}
		})
	}
}

func TestGetRegion(t *testing.T) {
	cfg := &Config{
		Azure: AzureConfig{
			Regions: []RegionConfig{
				{Name: "eastus", Location: "eastus", Enabled: true},
				{Name: "westus", Location: "westus", Enabled: false},
			},
		},
	}

	tests := []struct {
		name       string
		regionName string
		wantNil    bool
	}{
		{
			name:       "enabled region",
			regionName: "eastus",
			wantNil:    false,
		},
		{
			name:       "disabled region",
			regionName: "westus",
			wantNil:    true,
		},
		{
			name:       "non-existent region",
			regionName: "centralus",
			wantNil:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			region := cfg.GetRegion(tt.regionName)
			if (region == nil) != tt.wantNil {
				t.Errorf("GetRegion() = %v, wantNil %v", region, tt.wantNil)
			}
		})
	}
}

func TestGetEnabledRegions(t *testing.T) {
	cfg := &Config{
		Azure: AzureConfig{
			Regions: []RegionConfig{
				{Name: "eastus", Enabled: true},
				{Name: "westus", Enabled: false},
				{Name: "centralus", Enabled: true},
			},
		},
	}

	enabled := cfg.GetEnabledRegions()
	if len(enabled) != 2 {
		t.Errorf("GetEnabledRegions() returned %d regions, want 2", len(enabled))
	}
}

func TestLoadRegions(t *testing.T) {
	tests := []struct {
		name       string
		regionsEnv string
		wantCount  int
		wantErr    bool
	}{
		{
			name:       "valid multi-region config",
			regionsEnv: "eastus:East US:true:rg-east:storage1,westus:West US:true:rg-west:storage2",
			wantCount:  2,
			wantErr:    false,
		},
		{
			name:       "single region",
			regionsEnv: "eastus:East US:true",
			wantCount:  1,
			wantErr:    false,
		},
		{
			name:       "empty regions",
			regionsEnv: "",
			wantCount:  1, // Should return default region
			wantErr:    false,
		},
		{
			name:       "malformed region",
			regionsEnv: "eastus:true", // Missing location
			wantCount:  0,
			wantErr:    true, // Should error when no valid regions
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			if tt.regionsEnv != "" {
				os.Setenv("AZURE_REGIONS", tt.regionsEnv)
			}

			regions, err := loadRegions()
			if (err != nil) != tt.wantErr {
				t.Errorf("loadRegions() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if len(regions) != tt.wantCount {
				t.Errorf("loadRegions() returned %d regions, want %d", len(regions), tt.wantCount)
			}
		})
	}
}

func TestLoadCORSAllowedOrigins(t *testing.T) {
	tests := []struct {
		name      string
		corsEnv   string
		wantCount int
	}{
		{
			name:      "multiple origins",
			corsEnv:   "https://dev8.dev,https://app.dev8.dev,http://localhost:3000",
			wantCount: 3,
		},
		{
			name:      "single origin",
			corsEnv:   "https://dev8.dev",
			wantCount: 1,
		},
		{
			name:      "empty origins",
			corsEnv:   "",
			wantCount: 1, // Default localhost
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			if tt.corsEnv != "" {
				os.Setenv("CORS_ALLOWED_ORIGINS", tt.corsEnv)
			}

			origins := loadCORSAllowedOrigins()
			if len(origins) != tt.wantCount {
				t.Errorf("loadCORSAllowedOrigins() returned %d origins, want %d", len(origins), tt.wantCount)
			}
		})
	}
}
