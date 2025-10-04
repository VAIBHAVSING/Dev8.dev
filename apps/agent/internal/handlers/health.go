package handlers

import (
	"net/http"
	"time"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	startTime time.Time
}

// NewHealthHandler creates a new health handler
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
	}
}

// HealthCheck handles GET /health
func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	uptime := time.Since(h.startTime)

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status":  "healthy",
		"uptime":  uptime.String(),
		"service": "dev8-agent",
		"version": "1.0.0",
	})
}

// ReadinessCheck handles GET /ready
func (h *HealthHandler) ReadinessCheck(w http.ResponseWriter, r *http.Request) {
	// TODO: Check if all dependencies are ready (database, Azure services, etc.)
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status": "ready",
	})
}

// LivenessCheck handles GET /live
func (h *HealthHandler) LivenessCheck(w http.ResponseWriter, r *http.Request) {
	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status": "alive",
	})
}
