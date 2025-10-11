package config

import (
	"fmt"
	"os"
	"strings"
	"time"
)

// Config captures runtime configuration for the workspace supervisor daemon.
type Config struct {
	WorkspaceDir    string
	MonitorInterval time.Duration
	LogFilePath     string

	Backup BackupConfig
	Mount  MountConfig
	HTTP   HTTPConfig
	Agent  AgentConfig
}

// BackupConfig controls backup scheduling and target settings.
type BackupConfig struct {
	Enabled          bool
	Interval         time.Duration
	MountPath        string
	SnapshotBasePath string
	Excludes         []string
	SyncOnActivity   bool
}

// MountConfig contains Azure Blob (blobfuse2) mounting configuration.
type MountConfig struct {
	EnsureMount  bool
	MountPath    string
	TempPath     string
	BlobfusePath string
	AccountName  string
	AccountKey   string
	Container    string
	SASToken     string
	Endpoint     string
	AllowOther   bool
}

// HTTPConfig exposes the local status server configuration.
type HTTPConfig struct {
	Enabled bool
	Addr    string
}

// AgentConfig controls reporting activity back to the Dev8 agent API.
type AgentConfig struct {
	Enabled          bool
	BaseURL          string
	EnvironmentID    string
	APIKey           string
	Timeout          time.Duration
	ActivityEndpoint string
}

// Load reads environment variables and returns the corresponding Config.
func Load() (Config, error) {
	cfg := Config{
		WorkspaceDir:    getEnv("WORKSPACE_DIR", "/workspace"),
		MonitorInterval: getDurationEnv("SUPERVISOR_MONITOR_INTERVAL", 30*time.Second),
		LogFilePath:     getEnv("SUPERVISOR_LOG_FILE", "/var/log/workspace-supervisor.log"),
	}

	backupInterval := getDurationEnv("SUPERVISOR_BACKUP_INTERVAL", 15*time.Minute)
	backupMount := getEnv("SUPERVISOR_BACKUP_MOUNT_PATH", "/mnt/azureblob")
	backupEnabled := backupMount != "" && backupInterval > 0

	excludeList := strings.Split(getEnv("SUPERVISOR_BACKUP_EXCLUDES", ".cache,.git/node_modules"), ",")
	cfg.Backup = BackupConfig{
		Enabled:          backupEnabled,
		Interval:         backupInterval,
		MountPath:        backupMount,
		SnapshotBasePath: getEnv("SUPERVISOR_BACKUP_SNAPSHOT_PATH", "snapshots"),
		Excludes:         cleanList(excludeList),
		SyncOnActivity:   getBoolEnv("SUPERVISOR_BACKUP_SYNC_ON_ACTIVITY", true),
	}

	cfg.Mount = MountConfig{
		EnsureMount:  getBoolEnv("SUPERVISOR_MOUNT_ENABLE", true),
		MountPath:    backupMount,
		TempPath:     getEnv("SUPERVISOR_BLOBFUSE_TMP", "/tmp/blobfuse2"),
		BlobfusePath: getEnv("SUPERVISOR_BLOBFUSE_BIN", "blobfuse2"),
		AccountName:  os.Getenv("AZURE_BLOB_ACCOUNT_NAME"),
		AccountKey:   os.Getenv("AZURE_BLOB_ACCOUNT_KEY"),
		Container:    os.Getenv("AZURE_BLOB_CONTAINER"),
		SASToken:     os.Getenv("AZURE_BLOB_SAS_TOKEN"),
		Endpoint:     getEnv("AZURE_BLOB_ENDPOINT", ""),
		AllowOther:   getBoolEnv("SUPERVISOR_BLOBFUSE_ALLOW_OTHER", true),
	}

	cfg.HTTP = HTTPConfig{
		Enabled: getBoolEnv("SUPERVISOR_HTTP_ENABLED", true),
		Addr:    getEnv("SUPERVISOR_HTTP_ADDR", "127.0.0.1:9000"),
	}

	agentTimeout := getDurationEnv("SUPERVISOR_AGENT_TIMEOUT", 5*time.Second)
	cfg.Agent = AgentConfig{
		Enabled:          getBoolEnv("SUPERVISOR_AGENT_ENABLED", true),
		BaseURL:          getEnv("SUPERVISOR_AGENT_BASE_URL", ""),
		EnvironmentID:    getEnv("ENVIRONMENT_ID", ""),
		APIKey:           os.Getenv("SUPERVISOR_AGENT_API_KEY"),
		Timeout:          agentTimeout,
		ActivityEndpoint: getEnv("SUPERVISOR_AGENT_ACTIVITY_ENDPOINT", ""),
	}

	// Basic validation
	if cfg.Backup.Enabled && cfg.Backup.MountPath == "" {
		return Config{}, fmt.Errorf("backup mount path must be provided when backups are enabled")
	}

	if cfg.Mount.EnsureMount && cfg.Backup.Enabled && cfg.Mount.MountPath == "" {
		return Config{}, fmt.Errorf("mount path must be set when mount enforcement is enabled")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return fallback
	}
	d, err := time.ParseDuration(val)
	if err != nil {
		return fallback
	}
	return d
}

func getBoolEnv(key string, fallback bool) bool {
	val := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if val == "" {
		return fallback
	}
	switch val {
	case "true", "1", "yes", "y", "on":
		return true
	case "false", "0", "no", "n", "off":
		return false
	default:
		return fallback
	}
}

func cleanList(values []string) []string {
	var cleaned []string
	for _, v := range values {
		trimmed := strings.TrimSpace(v)
		if trimmed == "" {
			continue
		}
		cleaned = append(cleaned, trimmed)
	}
	return cleaned
}

// WithOverrides returns a copy of Config with overrides applied (useful for tests).
func (c Config) WithOverrides(overrides map[string]string) Config {
	for key, value := range overrides {
		switch key {
		case "WorkspaceDir":
			c.WorkspaceDir = value
		case "MonitorInterval":
			if d, err := time.ParseDuration(value); err == nil {
				c.MonitorInterval = d
			}
		case "BackupInterval":
			if d, err := time.ParseDuration(value); err == nil {
				c.Backup.Interval = d
			}
		case "BackupMountPath":
			c.Backup.MountPath = value
		case "BackupSnapshotBasePath":
			c.Backup.SnapshotBasePath = value
		case "HTTPAddr":
			c.HTTP.Addr = value
		case "HTTPEabled":
			c.HTTP.Enabled = value != "false"
		case "MountEnsure":
			c.Mount.EnsureMount = value != "false"
		case "MountPath":
			c.Mount.MountPath = value
		case "MountTempPath":
			c.Mount.TempPath = value
		case "MountAccountName":
			c.Mount.AccountName = value
		case "MountAccountKey":
			c.Mount.AccountKey = value
		case "MountContainer":
			c.Mount.Container = value
		case "MountSAS":
			c.Mount.SASToken = value
		}
	}
	return c
}

// EffectiveMountCredentials returns a human readable description of the configured credentials
// without leaking sensitive values. Useful for logging.
func (c Config) EffectiveMountCredentials() string {
	if c.Mount.AccountName == "" && c.Mount.Container == "" {
		return "mount-disabled"
	}
	maskedKey := maskValue(c.Mount.AccountKey)
	maskedSAS := maskValue(c.Mount.SASToken)
	return fmt.Sprintf("account=%s container=%s key=%s sas=%s", c.Mount.AccountName, c.Mount.Container, maskedKey, maskedSAS)
}

func maskValue(value string) string {
	if value == "" {
		return "<empty>"
	}
	if len(value) <= 6 {
		return "***"
	}
	return fmt.Sprintf("%s***%s", value[:3], value[len(value)-3:])
}

// BackupExclusionArgs converts exclusion patterns into rsync-friendly arguments.
func (c Config) BackupExclusionArgs() []string {
	var args []string
	for _, pattern := range c.Backup.Excludes {
		args = append(args, "--exclude", pattern)
	}
	return args
}

// Validate ensures config is internally consistent.
func (c Config) Validate() error {
	if c.Backup.Enabled {
		if c.Backup.MountPath == "" {
			return fmt.Errorf("backup mount path required when backups are enabled")
		}
		if c.Backup.Interval <= 0 {
			return fmt.Errorf("backup interval must be positive")
		}
	}
	if c.Mount.EnsureMount && c.Mount.MountPath == "" {
		return fmt.Errorf("mount path required when mount enforcement is enabled")
	}
	if c.Agent.Enabled {
		if c.Agent.EnvironmentID == "" {
			return fmt.Errorf("ENVIRONMENT_ID must be set when agent reporting is enabled")
		}
		if c.Agent.ActivityEndpoint == "" && c.Agent.BaseURL == "" {
			return fmt.Errorf("SUPERVISOR_AGENT_BASE_URL or SUPERVISOR_AGENT_ACTIVITY_ENDPOINT must be set when agent reporting is enabled")
		}
	}
	return nil
}
