package monitor

import (
	"sync"
	"time"
)

// State captures live usage metrics for the workspace environment.
type State struct {
	mu sync.RWMutex

	lastIDEActivity time.Time
	lastSSHActivity time.Time

	activeIDEConnections int
	activeSSHConnections int
}

// UpdateIDE records recent IDE activity metrics.
func (s *State) UpdateIDE(timestamp time.Time, connections int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.activeIDEConnections = connections
	if connections > 0 {
		s.lastIDEActivity = timestamp
	}
}

// UpdateSSH records SSH usage activity.
func (s *State) UpdateSSH(timestamp time.Time, connections int) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.activeSSHConnections = connections
	if connections > 0 {
		s.lastSSHActivity = timestamp
	}
}

// Snapshot returns a copy of the current state.
type Snapshot struct {
	LastIDEActivity time.Time `json:"lastIDEActivity"`
	LastSSHActivity time.Time `json:"lastSSHActivity"`
	ActiveIDE       int       `json:"activeIDEConnections"`
	ActiveSSH       int       `json:"activeSSHConnections"`
}

// Snapshot returns the state in a concurrency safe way.
func (s *State) Snapshot() Snapshot {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return Snapshot{
		LastIDEActivity: s.lastIDEActivity,
		LastSSHActivity: s.lastSSHActivity,
		ActiveIDE:       s.activeIDEConnections,
		ActiveSSH:       s.activeSSHConnections,
	}
}
