package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/models"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/services"
	"github.com/gorilla/mux"
)

// EnvironmentHandler handles environment-related HTTP requests
type EnvironmentHandler struct {
	service *services.EnvironmentService
}

// NewEnvironmentHandler creates a new environment handler
func NewEnvironmentHandler(service *services.EnvironmentService) *EnvironmentHandler {
	return &EnvironmentHandler{
		service: service,
	}
}

// CreateEnvironment handles POST /api/v1/environments
func (h *EnvironmentHandler) CreateEnvironment(w http.ResponseWriter, r *http.Request) {
	var req models.CreateEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// TODO: Extract user ID from authentication context
	// For now, we'll use a placeholder
	if req.UserID == "" {
		req.UserID = "default-user"
	}

	env, err := h.service.CreateEnvironment(r.Context(), &req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusCreated, models.EnvironmentResponse{
		Environment: env,
		Message:     "Environment created successfully",
	})
}

// GetEnvironment handles GET /api/v1/environments/{id}
// This endpoint is deprecated - Next.js maintains environment state
func (h *EnvironmentHandler) GetEnvironment(w http.ResponseWriter, r *http.Request) {
	respondWithError(w, http.StatusNotImplemented, "This endpoint is not implemented",
		fmt.Errorf("environment data is managed by Next.js - query the Next.js API instead"))
}

// ListEnvironments handles GET /api/v1/environments
// This endpoint is deprecated - Next.js maintains environment state
func (h *EnvironmentHandler) ListEnvironments(w http.ResponseWriter, r *http.Request) {
	respondWithError(w, http.StatusNotImplemented, "This endpoint is not implemented",
		fmt.Errorf("environment data is managed by Next.js - query the Next.js API instead"))
}

// StartEnvironment handles POST /api/v1/environments/{id}/start
// Next.js must provide Azure resource identifiers in the request body
func (h *EnvironmentHandler) StartEnvironment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	envID := vars["id"]

	var req models.StartEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.service.StartEnvironment(r.Context(), req.Region, req.ResourceGroup, req.ContainerGroupName); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Environment started successfully",
		"id":      envID,
	})
}

// StopEnvironment handles POST /api/v1/environments/{id}/stop
// Next.js must provide Azure resource identifiers in the request body
func (h *EnvironmentHandler) StopEnvironment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	envID := vars["id"]

	var req models.StopEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.service.StopEnvironment(r.Context(), req.Region, req.ResourceGroup, req.ContainerGroupName); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Environment stopped successfully",
		"id":      envID,
	})
}

// ReportActivity handles POST /api/v1/environments/{id}/activity
func (h *EnvironmentHandler) ReportActivity(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	envID := vars["id"]

	var payload models.ActivityReport
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := payload.Normalize(envID); err != nil {
		handleServiceError(w, err)
		return
	}

	if err := h.service.RecordActivity(r.Context(), &payload); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "Activity recorded",
		"environmentId": payload.EnvironmentID,
		"snapshot":      payload.Snapshot,
		"timestamp":     payload.Timestamp,
	})
}

// DeleteEnvironment handles DELETE /api/v1/environments/{id}
// Next.js must provide Azure resource identifiers in the request body
func (h *EnvironmentHandler) DeleteEnvironment(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	envID := vars["id"]

	var req models.DeleteEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if err := h.service.DeleteEnvironment(r.Context(), req.Region, req.ResourceGroup, req.ContainerGroupName, req.FileShareName); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Environment deleted successfully",
		"id":      envID,
	})
}

// Helper functions

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string, err error) {
	log.Printf("Error: %s - %v", message, err)
	respondWithJSON(w, code, models.ErrorResponse{
		Error:   message,
		Message: err.Error(),
	})
}

func handleServiceError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*models.AppError); ok {
		switch appErr.Code {
		case "INVALID_REQUEST":
			respondWithError(w, http.StatusBadRequest, "Invalid request", err)
		case "NOT_FOUND":
			respondWithError(w, http.StatusNotFound, "Resource not found", err)
		case "UNAUTHORIZED":
			respondWithError(w, http.StatusUnauthorized, "Unauthorized", err)
		default:
			respondWithError(w, http.StatusInternalServerError, "Internal server error", err)
		}
	} else {
		respondWithError(w, http.StatusInternalServerError, "Internal server error", err)
	}
}
