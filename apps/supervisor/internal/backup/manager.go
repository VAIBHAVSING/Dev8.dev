package backup

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/monitor"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/mount"
)

// Manager handles workspace backup synchronisation to the mounted Azure Blob volume.
type Manager struct {
	logger   *slog.Logger
	cfg      config.Config
	mount    *mount.Manager
	state    *monitor.State
	rsyncBin string
}

// New creates a backup manager.
func New(logger *slog.Logger, cfg config.Config, mountManager *mount.Manager, state *monitor.State) *Manager {
	return &Manager{
		logger:   logger,
		cfg:      cfg,
		mount:    mountManager,
		state:    state,
		rsyncBin: "rsync",
	}
}

// Run executes the backup loop until context cancellation.
func (m *Manager) Run(ctx context.Context) error {
	if !m.cfg.Backup.Enabled {
		m.logger.Info("backup manager disabled via configuration")
		return nil
	}

	ticker := time.NewTicker(m.cfg.Backup.Interval)
	defer ticker.Stop()

	m.logger.Info("backup manager started", "interval", m.cfg.Backup.Interval, "mount", m.cfg.Backup.MountPath)

	// perform initial backup shortly after startup
	if err := m.performBackup(ctx, true); err != nil {
		m.logger.Error("initial backup failed", "error", err)
	}

	for {
		select {
		case <-ctx.Done():
			m.logger.Info("backup manager stopping", "reason", ctx.Err())
			return nil
		case <-ticker.C:
			if err := m.performBackup(ctx, false); err != nil {
				m.logger.Error("scheduled backup failed", "error", err)
			}
		}
	}
}

func (m *Manager) performBackup(ctx context.Context, startup bool) error {
	snapshot := m.state.Snapshot()

	if m.cfg.Backup.SyncOnActivity {
		if snapshot.ActiveIDE == 0 && snapshot.ActiveSSH == 0 {
			lastActivity := latestActivity(snapshot.LastIDEActivity, snapshot.LastSSHActivity)
			if !startup {
				if lastActivity.IsZero() {
					m.logger.Debug("skipping backup due to no recorded activity")
					return nil
				}
				idleFor := time.Since(lastActivity)
				if idleFor > m.cfg.Backup.Interval {
					m.logger.Debug("skipping backup due to inactivity", "idleFor", idleFor.String())
					return nil
				}
			}
		}
	}

	if err := m.mount.Ensure(ctx); err != nil {
		return fmt.Errorf("ensure mount: %w", err)
	}

	destination := filepath.Join(m.cfg.Backup.MountPath, m.cfg.Backup.SnapshotBasePath, "current")
	if err := os.MkdirAll(destination, 0o755); err != nil {
		return fmt.Errorf("create destination: %w", err)
	}

	args := []string{"-a", "--delete"}
	args = append(args, m.cfg.BackupExclusionArgs()...)
	args = append(args, fmt.Sprintf("%s/", filepath.Clean(m.cfg.WorkspaceDir)))
	args = append(args, fmt.Sprintf("%s/", filepath.Clean(destination)))

	cmd := exec.CommandContext(ctx, m.rsyncBin, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	m.logger.Info("starting workspace backup", "destination", destination)
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("rsync: %w", err)
	}

	metadata := map[string]any{
		"timestamp":           time.Now().UTC().Format(time.RFC3339),
		"workspace":           m.cfg.WorkspaceDir,
		"snapshotDestination": destination,
		"activeIDE":           snapshot.ActiveIDE,
		"activeSSH":           snapshot.ActiveSSH,
	}

	metaPath := filepath.Join(m.cfg.Backup.MountPath, "backup-status.json")
	if err := writeJSON(metaPath, metadata); err != nil {
		m.logger.Warn("failed to persist backup metadata", "error", err)
	} else {
		m.logger.Info("workspace backup complete", "metadata", metaPath)
	}

	return nil
}

func writeJSON(path string, payload any) error {
	bytes, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, bytes, 0o644)
}

func latestActivity(a, b time.Time) time.Time {
	if a.IsZero() && b.IsZero() {
		return time.Time{}
	}
	if a.IsZero() {
		return b
	}
	if b.IsZero() {
		return a
	}
	if a.After(b) {
		return a
	}
	return b
}
