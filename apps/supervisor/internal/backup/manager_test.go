package backup

import (
	"context"
	"log/slog"
	"testing"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/monitor"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/mount"
)

func TestNew(t *testing.T) {
	logger := slog.Default()
	cfg := config.Config{
		Backup: config.BackupConfig{
			Enabled:   true,
			Interval:  15 * time.Minute,
			MountPath: "/mnt/backup",
		},
	}
	state := &monitor.State{}
	mountMgr := mount.New(logger, config.MountConfig{})
	
	manager := New(logger, cfg, mountMgr, state)

	if manager == nil {
		t.Error("New() returned nil")
	}

	if manager.rsyncBin != "rsync" {
		t.Errorf("New() rsyncBin = %v, want rsync", manager.rsyncBin)
	}
}

func TestManager_Run_Disabled(t *testing.T) {
	logger := slog.Default()
	cfg := config.Config{
		Backup: config.BackupConfig{
			Enabled: false,
		},
	}
	state := &monitor.State{}
	mountMgr := mount.New(logger, config.MountConfig{})
	
	manager := New(logger, cfg, mountMgr, state)

	ctx := context.Background()
	err := manager.Run(ctx)

	if err != nil {
		t.Errorf("Run() with disabled backup error = %v, want nil", err)
	}
}

func TestManager_Run_Cancellation(t *testing.T) {
	logger := slog.Default()
	cfg := config.Config{
		Backup: config.BackupConfig{
			Enabled:   true,
			Interval:  1 * time.Second,
			MountPath: "/tmp/test-backup",
		},
		WorkspaceDir: "/tmp/test-workspace",
	}
	state := &monitor.State{}
	mountMgr := mount.New(logger, config.MountConfig{})
	
	manager := New(logger, cfg, mountMgr, state)

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	err := manager.Run(ctx)
	if err != nil {
		t.Errorf("Run() cancelled error = %v, want nil", err)
	}
}

func TestLatestActivity(t *testing.T) {
	now := time.Now()
	past := now.Add(-1 * time.Hour)
	zero := time.Time{}

	tests := []struct {
		name string
		a    time.Time
		b    time.Time
		want time.Time
	}{
		{
			name: "both zero",
			a:    zero,
			b:    zero,
			want: zero,
		},
		{
			name: "a zero",
			a:    zero,
			b:    now,
			want: now,
		},
		{
			name: "b zero",
			a:    now,
			b:    zero,
			want: now,
		},
		{
			name: "a more recent",
			a:    now,
			b:    past,
			want: now,
		},
		{
			name: "b more recent",
			a:    past,
			b:    now,
			want: now,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := latestActivity(tt.a, tt.b)
			if !got.Equal(tt.want) {
				t.Errorf("latestActivity() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestWriteJSON(t *testing.T) {
	tempDir := t.TempDir()
	testPath := tempDir + "/test.json"

	data := map[string]interface{}{
		"key1": "value1",
		"key2": 123,
	}

	err := writeJSON(testPath, data)
	if err != nil {
		t.Errorf("writeJSON() error = %v", err)
	}
}
