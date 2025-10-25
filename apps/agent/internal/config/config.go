package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

// Config holds the application configuration
type Config struct {
	// Server Configuration
	Port string
	Host string

	// Database Configuration
	DatabaseURL string // Optional - not used by Agent, kept for future

	// Azure Configuration
	Azure AzureConfig

	// CORS Configuration
	CORSAllowedOrigins []string

	// Application Settings
	Environment string
	LogLevel    string
}

// AzureConfig holds Azure-specific configuration
type AzureConfig struct {
	SubscriptionID     string
	ResourceGroupName  string
	StorageAccountName string
	StorageAccountKey  string
	ContainerRegistry  string

	// Multi-region support
	Regions       []RegionConfig
	DefaultRegion string
}

// RegionConfig holds region-specific configuration
type RegionConfig struct {
	Name              string
	Location          string
	Enabled           bool
	ResourceGroupName string
	StorageAccount    string
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	config := &Config{
		Port:        getEnv("AGENT_PORT", "8080"),
		Host:        getEnv("AGENT_HOST", "0.0.0.0"),
		DatabaseURL: getEnv("DATABASE_URL", ""), // Optional, no error if empty
		Environment: getEnv("ENVIRONMENT", "development"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
	}

	// Load CORS configuration
	config.CORSAllowedOrigins = loadCORSAllowedOrigins()

	// Load Azure configuration
	azureConfig, err := loadAzureConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to load Azure configuration: %w", err)
	}
	config.Azure = azureConfig

	// Validate configuration
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	return config, nil
}

// loadAzureConfig loads Azure-specific configuration
func loadAzureConfig() (AzureConfig, error) {
	config := AzureConfig{
		SubscriptionID:     getEnv("AZURE_SUBSCRIPTION_ID", ""),
		ResourceGroupName:  getEnv("AZURE_RESOURCE_GROUP", ""),
		StorageAccountName: getEnv("AZURE_STORAGE_ACCOUNT", ""),
		StorageAccountKey:  getEnv("AZURE_STORAGE_KEY", ""),
		ContainerRegistry:  getEnv("AZURE_CONTAINER_REGISTRY", ""),
		DefaultRegion:      getEnv("AZURE_DEFAULT_REGION", "eastus"),
	}

	// Load multi-region configuration
	regions, err := loadRegions()
	if err != nil {
		return config, fmt.Errorf("failed to load regions: %w", err)
	}
	config.Regions = regions

	return config, nil
}

// loadRegions loads multi-region configuration from environment variables
func loadRegions() ([]RegionConfig, error) {
	// AZURE_REGIONS format: "eastus:East US:true:rg-eastus:storageeastus,westus:West US:true:rg-westus:storagewestus"
	regionsEnv := getEnv("AZURE_REGIONS", "")
	if regionsEnv == "" {
		// Default single region
		defaultRegion := getEnv("AZURE_DEFAULT_REGION", "eastus")
		return []RegionConfig{
			{
				Name:              defaultRegion,
				Location:          defaultRegion,
				Enabled:           true,
				ResourceGroupName: getEnv("AZURE_RESOURCE_GROUP", ""),
				StorageAccount:    getEnv("AZURE_STORAGE_ACCOUNT", ""),
			},
		}, nil
	}

	var regions []RegionConfig
	regionStrs := strings.Split(regionsEnv, ",")

	for _, regionStr := range regionStrs {
		parts := strings.Split(strings.TrimSpace(regionStr), ":")
		if len(parts) < 3 {
			log.Printf("WARNING: Skipping malformed region config (expected format 'name:location:enabled[:resourceGroup[:storageAccount]]'): %s", regionStr)
			continue
		}

		enabled, err := strconv.ParseBool(parts[2])
		if err != nil {
			log.Printf("WARNING: Invalid boolean value for enabled flag in region config '%s': %v - skipping region", regionStr, err)
			continue
		}

		region := RegionConfig{
			Name:     parts[0],
			Location: parts[1],
			Enabled:  enabled,
		}

		if len(parts) > 3 {
			region.ResourceGroupName = parts[3]
		}
		if len(parts) > 4 {
			region.StorageAccount = parts[4]
		}

		regions = append(regions, region)
	}

	// If no valid regions were parsed, return an error
	if len(regions) == 0 && regionsEnv != "" {
		return nil, fmt.Errorf("no valid regions could be parsed from AZURE_REGIONS environment variable")
	}

	return regions, nil
}

// loadCORSAllowedOrigins loads CORS allowed origins from environment variables
func loadCORSAllowedOrigins() []string {
	// CORS_ALLOWED_ORIGINS format: comma-separated list of origins
	// Example: "https://dev8.dev,https://app.dev8.dev,http://localhost:3000"
	originsEnv := getEnv("CORS_ALLOWED_ORIGINS", "")
	if originsEnv == "" {
		// Default to localhost for development
		return []string{"http://localhost:3000"}
	}

	origins := strings.Split(originsEnv, ",")
	var trimmedOrigins []string
	for _, origin := range origins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			trimmedOrigins = append(trimmedOrigins, trimmed)
		}
	}

	return trimmedOrigins
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.Port == "" {
		return fmt.Errorf("AGENT_PORT is required")
	}

	// DATABASE_URL is now optional - Agent is stateless

	if c.Azure.SubscriptionID == "" {
		return fmt.Errorf("AZURE_SUBSCRIPTION_ID is required")
	}

	if len(c.Azure.Regions) == 0 {
		return fmt.Errorf("at least one Azure region must be configured")
	}

	return nil
}

// GetRegion returns the region configuration for the given region name
func (c *Config) GetRegion(name string) *RegionConfig {
	for _, region := range c.Azure.Regions {
		if region.Name == name && region.Enabled {
			return &region
		}
	}
	return nil
}

// GetEnabledRegions returns all enabled regions
func (c *Config) GetEnabledRegions() []RegionConfig {
	var enabled []RegionConfig
	for _, region := range c.Azure.Regions {
		if region.Enabled {
			enabled = append(enabled, region)
		}
	}
	return enabled
}

// getEnv gets an environment variable with a fallback default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
