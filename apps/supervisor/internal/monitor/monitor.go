package monitor

import (
	"context"
	"errors"
	"log/slog"
	"time"

	netstat "github.com/shirou/gopsutil/v3/net"
)

// Reporter receives activity updates from the monitor loop.
type Reporter interface {
	Report(ctx context.Context, snapshot Snapshot) error
}

// Monitor periodically measures active IDE and SSH connections.
type Monitor struct {
	logger   *slog.Logger
	state    *State
	reporter Reporter

	idePort uint32
	sshPort uint32

	interval time.Duration

	lastIDECount int
	lastSSHCount int
}

// New creates a Monitor instance.
func New(logger *slog.Logger, state *State, interval time.Duration, reporter Reporter) *Monitor {
	return &Monitor{
		logger:   logger,
		state:    state,
		idePort:  8080,
		sshPort:  2222,
		interval: interval,
		reporter: reporter,
	}
}

// Run starts the monitoring loop until the context is cancelled.
func (m *Monitor) Run(ctx context.Context) error {
	if m.interval <= 0 {
		return errors.New("monitor interval must be greater than zero")
	}

	ticker := time.NewTicker(m.interval)
	defer ticker.Stop()

	m.logger.Info("workspace monitor loop started", "interval", m.interval)

	for {
		if err := m.sample(ctx); err != nil {
			m.logger.Error("failed to sample activity", "error", err)
		}

		select {
		case <-ctx.Done():
			m.logger.Info("workspace monitor loop stopping", "reason", ctx.Err())
			return nil
		case <-ticker.C:
			continue
		}
	}
}

func (m *Monitor) sample(ctx context.Context) error {
	connStats, err := netstat.ConnectionsWithContext(ctx, "tcp")
	if err != nil {
		return err
	}

	var ideCount, sshCount int
	for _, c := range connStats {
		if c.Status != "ESTABLISHED" {
			continue
		}
		switch c.Laddr.Port {
		case m.idePort:
			ideCount++
		case m.sshPort:
			sshCount++
		}
	}

	now := time.Now()
	m.state.UpdateIDE(now, ideCount)
	m.state.UpdateSSH(now, sshCount)

	if ideCount != m.lastIDECount || sshCount != m.lastSSHCount {
		m.logger.Info("workspace activity update",
			"ideConnections", ideCount,
			"sshConnections", sshCount,
			"timestamp", now.Format(time.RFC3339),
		)
		m.lastIDECount = ideCount
		m.lastSSHCount = sshCount

		if m.reporter != nil {
			reportSnapshot := m.state.Snapshot()
			if err := m.reporter.Report(ctx, reportSnapshot); err != nil {
				m.logger.Error("failed to report activity", "error", err)
			}
		}
	}

	return nil
}

// Snapshot returns the latest state snapshot.
func (m *Monitor) Snapshot() Snapshot {
	return m.state.Snapshot()
}
