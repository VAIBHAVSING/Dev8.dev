package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad(t *testing.T) {
	tests := []struct {
		name    string
		envVars map[string]string
		wantErr bool
	}{
		{
			name: "valid minimal config",
			envVars: map[string]string{
				"WORKSPACE_DIR":                     "/workspace",
				"SUPERVISOR_MONITOR_INTERVAL":       "30s",
				"SUPERVISOR_BACKUP_MOUNT_PATH":      "",
				"SUPERVISOR_MOUNT_ENABLE":           "false",
				"SUPERVISOR_AGENT_ENABLED":          "false",
			},
			wantErr: false,
		},
		{
			name: "valid config with backups",
			envVars: map[string]string{
				"WORKSPACE_DIR":                     "/workspace",
				"SUPERVISOR_MONITOR_INTERVAL":       "30s",
				"SUPERVISOR_BACKUP_INTERVAL":        "15m",
				"SUPERVISOR_BACKUP_MOUNT_PATH":      "/mnt/backup",
				"SUPERVISOR_MOUNT_ENABLE":           "true",
				"SUPERVISOR_AGENT_ENABLED":          "false",
			},
			wantErr: false,
		},
		{
			name: "agent enabled without environment ID",
			envVars: map[string]string{
				"WORKSPACE_DIR":                "/workspace",
				"SUPERVISOR_AGENT_ENABLED":     "true",
				"SUPERVISOR_AGENT_BASE_URL":    "http://agent:8080",
				"SUPERVISOR_MOUNT_ENABLE":      "false",
				"SUPERVISOR_BACKUP_MOUNT_PATH": "",
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
			if err != nil && !tt.wantErr {
				t.Errorf("Load() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err == nil && !tt.wantErr {
				// Validate the loaded config
				if err := cfg.Validate(); (err != nil) != tt.wantErr {
					t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
				}
			}
		})
	}
}

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		value    string
		fallback string
		want     string
	}{
		{
			name:     "existing variable",
			key:      "TEST_VAR",
			value:    "test_value",
			fallback: "default",
			want:     "test_value",
		},
		{
			name:     "missing variable",
			key:      "MISSING_VAR",
			value:    "",
			fallback: "default",
			want:     "default",
		},
		{
			name:     "whitespace value",
			key:      "WHITESPACE_VAR",
			value:    "   ",
			fallback: "default",
			want:     "default",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			if tt.value != "" {
				os.Setenv(tt.key, tt.value)
			}

			got := getEnv(tt.key, tt.fallback)
			if got != tt.want {
				t.Errorf("getEnv() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetDurationEnv(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		value    string
		fallback time.Duration
		want     time.Duration
	}{
		{
			name:     "valid duration",
			key:      "TEST_DURATION",
			value:    "30s",
			fallback: 10 * time.Second,
			want:     30 * time.Second,
		},
		{
			name:     "invalid duration",
			key:      "TEST_DURATION",
			value:    "invalid",
			fallback: 10 * time.Second,
			want:     10 * time.Second,
		},
		{
			name:     "missing variable",
			key:      "MISSING_DURATION",
			value:    "",
			fallback: 10 * time.Second,
			want:     10 * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			if tt.value != "" {
				os.Setenv(tt.key, tt.value)
			}

			got := getDurationEnv(tt.key, tt.fallback)
			if got != tt.want {
				t.Errorf("getDurationEnv() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestGetBoolEnv(t *testing.T) {
	tests := []struct {
		name     string
		value    string
		fallback bool
		want     bool
	}{
		{name: "true", value: "true", fallback: false, want: true},
		{name: "1", value: "1", fallback: false, want: true},
		{name: "yes", value: "yes", fallback: false, want: true},
		{name: "y", value: "y", fallback: false, want: true},
		{name: "on", value: "on", fallback: false, want: true},
		{name: "false", value: "false", fallback: true, want: false},
		{name: "0", value: "0", fallback: true, want: false},
		{name: "no", value: "no", fallback: true, want: false},
		{name: "n", value: "n", fallback: true, want: false},
		{name: "off", value: "off", fallback: true, want: false},
		{name: "empty", value: "", fallback: true, want: true},
		{name: "invalid", value: "invalid", fallback: true, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			os.Clearenv()
			if tt.value != "" {
				os.Setenv("TEST_BOOL", tt.value)
			}

			got := getBoolEnv("TEST_BOOL", tt.fallback)
			if got != tt.want {
				t.Errorf("getBoolEnv() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCleanList(t *testing.T) {
	tests := []struct {
		name   string
		input  []string
		want   []string
	}{
		{
			name:   "mixed list",
			input:  []string{"item1", "  item2  ", "", "item3", "   "},
			want:   []string{"item1", "item2", "item3"},
		},
		{
			name:   "empty list",
			input:  []string{},
			want:   []string(nil),
		},
		{
			name:   "all empty",
			input:  []string{"", "  ", "   "},
			want:   []string(nil),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cleanList(tt.input)
			if len(got) != len(tt.want) {
				t.Errorf("cleanList() length = %v, want %v", len(got), len(tt.want))
			}
		})
	}
}

func TestBackupExclusionArgs(t *testing.T) {
	cfg := Config{
		Backup: BackupConfig{
			Excludes: []string{".git", "node_modules", ".cache"},
		},
	}

	args := cfg.BackupExclusionArgs()
	
	expectedLen := len(cfg.Backup.Excludes) * 2 // Each exclude becomes two args
	if len(args) != expectedLen {
		t.Errorf("BackupExclusionArgs() length = %v, want %v", len(args), expectedLen)
	}

	// Check format: should alternate between "--exclude" and pattern
	for i := 0; i < len(args); i += 2 {
		if args[i] != "--exclude" {
			t.Errorf("BackupExclusionArgs()[%d] = %v, want --exclude", i, args[i])
		}
	}
}

func TestEffectiveMountCredentials(t *testing.T) {
	tests := []struct {
		name   string
		config Config
		want   string
	}{
		{
			name: "no credentials",
			config: Config{
				Mount: MountConfig{},
			},
			want: "mount-disabled",
		},
		{
			name: "with account key",
			config: Config{
				Mount: MountConfig{
					AccountName: "testaccount",
					Container:   "testcontainer",
					AccountKey:  "verylongaccountkey123",
				},
			},
		},
		{
			name: "with SAS token",
			config: Config{
				Mount: MountConfig{
					AccountName: "testaccount",
					Container:   "testcontainer",
					SASToken:    "longsastoken123",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.config.EffectiveMountCredentials()
			if tt.want != "" && got != tt.want {
				t.Errorf("EffectiveMountCredentials() = %v, want %v", got, tt.want)
			}
			// Ensure sensitive data is not leaked
			if tt.config.Mount.AccountKey != "" && tt.config.Mount.AccountKey == got {
				t.Error("EffectiveMountCredentials() leaked account key")
			}
		})
	}
}

func TestMaskValue(t *testing.T) {
	tests := []struct {
		name  string
		value string
		want  string
	}{
		{
			name:  "empty value",
			value: "",
			want:  "<empty>",
		},
		{
			name:  "short value",
			value: "abc",
			want:  "***",
		},
		{
			name:  "long value",
			value: "verylongvalue123",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := maskValue(tt.value)
			if tt.want != "" && got != tt.want {
				t.Errorf("maskValue() = %v, want %v", got, tt.want)
			}
			// Ensure the original value is not returned in full
			if len(tt.value) > 6 && got == tt.value {
				t.Error("maskValue() did not mask the value")
			}
		})
	}
}

func TestValidate(t *testing.T) {
	tests := []struct {
		name    string
		config  Config
		wantErr bool
	}{
		{
			name: "valid config without backups",
			config: Config{
				Backup: BackupConfig{Enabled: false},
				Mount:  MountConfig{EnsureMount: false},
				Agent:  AgentConfig{Enabled: false},
			},
			wantErr: false,
		},
		{
			name: "backup enabled without mount path",
			config: Config{
				Backup: BackupConfig{
					Enabled:  true,
					Interval: 15 * time.Minute,
				},
				Mount: MountConfig{EnsureMount: false},
				Agent: AgentConfig{Enabled: false},
			},
			wantErr: true,
		},
		{
			name: "backup with zero interval",
			config: Config{
				Backup: BackupConfig{
					Enabled:   true,
					MountPath: "/mnt/backup",
					Interval:  0,
				},
				Mount: MountConfig{EnsureMount: false},
				Agent: AgentConfig{Enabled: false},
			},
			wantErr: true,
		},
		{
			name: "agent enabled without environment ID",
			config: Config{
				Backup: BackupConfig{Enabled: false},
				Mount:  MountConfig{EnsureMount: false},
				Agent: AgentConfig{
					Enabled: true,
					BaseURL: "http://agent:8080",
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
