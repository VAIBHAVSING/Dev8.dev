package report

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/supervisor/internal/monitor"
)

const defaultHTTPTimeout = 5 * time.Second

// HTTPReporter sends activity snapshots to the Dev8 agent API.
type HTTPReporter struct {
	client   *http.Client
	cfg      config.AgentConfig
	endpoint string
}

// NewHTTPReporter builds an HTTPReporter using agent configuration.
func NewHTTPReporter(cfg config.AgentConfig) (*HTTPReporter, error) {
	if !cfg.Enabled {
		return nil, nil
	}

	endpoint := strings.TrimSpace(cfg.ActivityEndpoint)
	if endpoint == "" {
		base := strings.TrimSuffix(strings.TrimSpace(cfg.BaseURL), "/")
		if base == "" {
			return nil, fmt.Errorf("agent base url must be provided")
		}
		if cfg.EnvironmentID == "" {
			return nil, fmt.Errorf("environment id must be provided to report activity")
		}
		endpoint = fmt.Sprintf("%s/api/v1/environments/%s/activity", base, cfg.EnvironmentID)
	}

	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = defaultHTTPTimeout
	}

	return &HTTPReporter{
		client:   &http.Client{Timeout: timeout},
		cfg:      cfg,
		endpoint: endpoint,
	}, nil
}

type payload struct {
	EnvironmentID string           `json:"environmentId"`
	Snapshot      monitor.Snapshot `json:"snapshot"`
	Timestamp     time.Time        `json:"timestamp"`
}

// Report sends the snapshot to the configured agent endpoint.
func (r *HTTPReporter) Report(ctx context.Context, snapshot monitor.Snapshot) error {
	if r == nil || !r.cfg.Enabled || r.endpoint == "" {
		return nil
	}

	body := payload{
		EnvironmentID: r.cfg.EnvironmentID,
		Snapshot:      snapshot,
		Timestamp:     time.Now().UTC(),
	}

	data, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal activity payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, r.endpoint, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "workspace-supervisor")
	if r.cfg.APIKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", r.cfg.APIKey))
	}

	resp, err := r.client.Do(req)
	if err != nil {
		return fmt.Errorf("post activity: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("post activity: unexpected status %s", resp.Status)
	}

	return nil
}
