package server

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/monitor"
)

// Server exposes supervisor state over HTTP.
type Server struct {
	logger *slog.Logger
	addr   string
	state  *monitor.State
	start  time.Time
}

// New returns a configured server instance.
func New(logger *slog.Logger, addr string, state *monitor.State) *Server {
	return &Server{
		logger: logger,
		addr:   addr,
		state:  state,
		start:  time.Now(),
	}
}

// Run starts serving HTTP until context cancellation.
func (s *Server) Run(ctx context.Context) error {
	s.logger.Info("starting supervisor status server", "addr", s.addr)

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/status", s.handleStatus)

	srv := &http.Server{
		Addr:    s.addr,
		Handler: mux,
	}

	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	select {
	case <-ctx.Done():
		s.logger.Info("http server shutting down", "reason", ctx.Err())
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	snapshot := s.state.Snapshot()

	payload := map[string]any{
		"healthy":       true,
		"uptimeSeconds": time.Since(s.start).Seconds(),
		"activeIDE":     snapshot.ActiveIDE,
		"activeSSH":     snapshot.ActiveSSH,
	}

	writeJSON(w, payload)
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	snapshot := s.state.Snapshot()

	payload := map[string]any{
		"uptime":          time.Since(s.start).Round(time.Second).String(),
		"startedAt":       s.start.UTC().Format(time.RFC3339),
		"lastIDEActivity": snapshot.LastIDEActivity,
		"lastSSHActivity": snapshot.LastSSHActivity,
		"activeIDE":       snapshot.ActiveIDE,
		"activeSSH":       snapshot.ActiveSSH,
	}

	writeJSON(w, payload)
}

func writeJSON(w http.ResponseWriter, payload any) {
	w.Header().Set("Content-Type", "application/json")
	encoder := json.NewEncoder(w)
	encoder.SetIndent("", "  ")
	_ = encoder.Encode(payload)
}
