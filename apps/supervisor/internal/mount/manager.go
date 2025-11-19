package mount

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/config"
)

// Manager ensures an Azure Blob mount is present using blobfuse2.
type Manager struct {
	logger *slog.Logger
	cfg    config.MountConfig

	mounted bool
}

// New manager instance.
func New(logger *slog.Logger, cfg config.MountConfig) *Manager {
	return &Manager{logger: logger, cfg: cfg}
}

// Ensure ensures that the mount is present before backups run.
func (m *Manager) Ensure(ctx context.Context) error {
	if !m.cfg.EnsureMount {
		return nil
	}

	if m.mounted {
		mounted, err := isMounted(m.cfg.MountPath)
		if err != nil {
			return err
		}
		if mounted {
			return nil
		}
		m.logger.Warn("mount previously marked as ready but now missing, remounting", "path", m.cfg.MountPath)
	}

	if err := validateConfig(m.cfg); err != nil {
		return err
	}

	if err := os.MkdirAll(m.cfg.MountPath, 0o755); err != nil {
		return fmt.Errorf("create mount path: %w", err)
	}

	if err := os.MkdirAll(m.cfg.TempPath, 0o755); err != nil {
		return fmt.Errorf("create temp path: %w", err)
	}

	mounted, err := isMounted(m.cfg.MountPath)
	if err != nil {
		return err
	}
	if mounted {
		m.mounted = true
		return nil
	}

	cfgFile, err := m.writeConfigFile()
	if err != nil {
		return err
	}
	defer os.Remove(cfgFile)

	args := []string{
		"mount",
		m.cfg.MountPath,
		fmt.Sprintf("--config-file=%s", cfgFile),
		fmt.Sprintf("--tmp-path=%s", m.cfg.TempPath),
		"--foreground=false",
		"--log-level=LOG_WARNING",
		"--use-https=true",
	}

	if m.cfg.AllowOther {
		args = append(args, "-o", "allow_other")
	}

	cmd := exec.CommandContext(ctx, m.cfg.BlobfusePath, args...)
	cmd.Env = append(os.Environ(), buildCredentialEnv(m.cfg)...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	m.logger.Info("mounting azure blob storage", "path", m.cfg.MountPath)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("blobfuse2 mount failed: %w", err)
	}

	// Wait for mount to appear (up to 5 seconds)
	deadline := time.Now().Add(5 * time.Second)
	for time.Now().Before(deadline) {
		mounted, err := isMounted(m.cfg.MountPath)
		if err != nil {
			return err
		}
		if mounted {
			m.logger.Info("azure blob mount ready", "path", m.cfg.MountPath)
			m.mounted = true
			return nil
		}
		time.Sleep(250 * time.Millisecond)
	}

	return errors.New("mount did not become ready in time")
}

func validateConfig(cfg config.MountConfig) error {
	if cfg.MountPath == "" {
		return errors.New("mount path must be provided")
	}
	if cfg.BlobfusePath == "" {
		return errors.New("blobfuse binary path must be specified")
	}
	if cfg.AccountName == "" {
		return errors.New("azure account name missing")
	}
	if cfg.Container == "" {
		return errors.New("azure container name missing")
	}
	if cfg.AccountKey == "" && cfg.SASToken == "" {
		return errors.New("azure account key or SAS token required")
	}
	return nil
}

func isMounted(path string) (bool, error) {
	data, err := os.ReadFile("/proc/mounts")
	if err != nil {
		return false, err
	}
	cleanPath := filepath.Clean(path)
	for _, line := range strings.Split(string(data), "\n") {
		if line == "" {
			continue
		}
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		if filepath.Clean(fields[1]) == cleanPath {
			return true, nil
		}
	}
	return false, nil
}

func (m *Manager) writeConfigFile() (string, error) {
	endpoint := m.cfg.Endpoint
	if endpoint == "" {
		endpoint = fmt.Sprintf("https://%s.blob.core.windows.net", m.cfg.AccountName)
	}

	var builder strings.Builder
	builder.WriteString("components:\n")
	builder.WriteString("  - libfuse\n")
	builder.WriteString("  - attr_cache\n")
	builder.WriteString("  - azstorage\n")
	builder.WriteString("  - file_cache\n")
	builder.WriteString("libfuse:\n  attribute-expiration-sec: 120\n")
	builder.WriteString("file_cache:\n  path: ")
	builder.WriteString(filepath.Join(m.cfg.TempPath, "cache"))
	builder.WriteString("\n  max-size-mb: 4096\n  cleanup-on-close: true\n")
	builder.WriteString("azstorage:\n")
	builder.WriteString("  account-name: ")
	builder.WriteString(m.cfg.AccountName)
	builder.WriteString("\n  container: ")
	builder.WriteString(m.cfg.Container)
	builder.WriteString("\n  endpoint: ")
	builder.WriteString(endpoint)
	builder.WriteString("\n")

	if m.cfg.AccountKey != "" {
		builder.WriteString("  account-key: \"")
		builder.WriteString(m.cfg.AccountKey)
		builder.WriteString("\"\n")
	}
	if m.cfg.SASToken != "" {
		builder.WriteString("  sas: \"")
		builder.WriteString(m.cfg.SASToken)
		builder.WriteString("\"\n")
	}

	configPath := filepath.Join(m.cfg.TempPath, "blobfuse2-config.yaml")
	if err := os.WriteFile(configPath, []byte(builder.String()), 0o600); err != nil {
		return "", err
	}
	return configPath, nil
}

func buildCredentialEnv(cfg config.MountConfig) []string {
	var env []string
	if cfg.AccountKey != "" {
		env = append(env, fmt.Sprintf("AZURE_STORAGE_ACCESS_KEY=%s", cfg.AccountKey))
	}
	if cfg.SASToken != "" {
		env = append(env, fmt.Sprintf("AZURE_STORAGE_SAS_TOKEN=%s", cfg.SASToken))
	}
	return env
}
