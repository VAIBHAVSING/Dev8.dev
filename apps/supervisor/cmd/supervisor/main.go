package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"golang.org/x/sync/errgroup"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/backup"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/logger"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/monitor"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/mount"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/report"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	if err := cfg.Validate(); err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	log, cleanup, err := logger.New(cfg.LogFilePath)
	if err != nil {
		slog.Error("failed to initialise logger", "error", err)
		os.Exit(1)
	}
	defer cleanup()

	log.Info("workspace supervisor starting",
		"workspace", cfg.WorkspaceDir,
		"monitorInterval", cfg.MonitorInterval,
		"backupEnabled", cfg.Backup.Enabled,
		"backupInterval", cfg.Backup.Interval,
		"mount", cfg.EffectiveMountCredentials(),
	)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	state := &monitor.State{}

	var activityReporter monitor.Reporter
	if cfg.Agent.Enabled {
		reporter, err := report.NewHTTPReporter(cfg.Agent)
		if err != nil {
			log.Error("failed to initialise activity reporter", "error", err)
			os.Exit(1)
		}
		activityReporter = reporter
	}

	monitorLoop := monitor.New(log, state, cfg.MonitorInterval, activityReporter)
	mountManager := mount.New(log, cfg.Mount)
	backupManager := backup.New(log, cfg, mountManager, state)

	grp, ctx := errgroup.WithContext(ctx)
	grp.Go(func() error { return monitorLoop.Run(ctx) })

	if cfg.Backup.Enabled {
		grp.Go(func() error { return backupManager.Run(ctx) })
	}

	if cfg.HTTP.Enabled {
		statusServer := server.New(log, cfg.HTTP.Addr, state)
		grp.Go(func() error { return statusServer.Run(ctx) })
	}

	if err := grp.Wait(); err != nil {
		log.Error("supervisor terminated with error", "error", err)
		os.Exit(1)
	}

	log.Info("supervisor shut down gracefully")
}
