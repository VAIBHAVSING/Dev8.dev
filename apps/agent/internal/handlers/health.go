package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	startTime   time.Time
	azureClient *azure.Client
	config      *config.Config
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(azureClient *azure.Client, cfg *config.Config) *HealthHandler {
	return &HealthHandler{
		startTime:   time.Now(),
		azureClient: azureClient,
		config:      cfg,
	}
}

// HealthCheck handles GET /health with dependency checks
func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(h.startTime)
	ctx := r.Context()

	// Check Azure connectivity
	azureStatus := h.checkAzureConnectivity(ctx)

	// Overall health status
	overallStatus := "healthy"
	statusCode := http.StatusOK

	if !azureStatus {
		overallStatus = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	respondWithJSON(w, statusCode, map[string]any{
		"status":  overallStatus,
		"uptime":  uptime.String(),
		"service": "dev8-agent",
		"version": "2.0.0",
		"checks": map[string]any{
			"azure": map[string]any{
				"status": getStatusString(azureStatus),
			},
		},
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// ReadinessCheck handles GET /ready
func (h *HealthHandler) ReadinessCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Check Azure connectivity
	azureReady := h.checkAzureConnectivity(ctx)

	ready := azureReady
	statusCode := http.StatusOK
	if !ready {
		statusCode = http.StatusServiceUnavailable
	}

	respondWithJSON(w, statusCode, map[string]any{
		"status": getStatusString(ready),
		"checks": map[string]any{
			"azure": getStatusString(azureReady),
		},
	})
}

// LivenessCheck handles GET /live
func (h *HealthHandler) LivenessCheck(w http.ResponseWriter, r *http.Request) {
	respondWithJSON(w, http.StatusOK, map[string]any{
		"status": "alive",
	})
}

// checkAzureConnectivity checks if Azure services are accessible
func (h *HealthHandler) checkAzureConnectivity(ctx context.Context) bool {
	// Try to check connectivity by querying a region
	for _, region := range h.config.GetEnabledRegions() {
		if region.Enabled {
			// Try to get ACI client - this validates credentials and connectivity
			if _, err := h.azureClient.GetACIClient(region.Name); err != nil {
				log := logger.FromContext(ctx)
				log.Warn().
					Err(err).
					Str("region", region.Name).
					Msg("Azure connectivity check failed")
				return false
			}
			// If one region works, we're good
			return true
		}
	}

	return true
}

// getStatusString converts boolean status to string
func getStatusString(status bool) string {
	if status {
		return "healthy"
	}
	return "unhealthy"
}
