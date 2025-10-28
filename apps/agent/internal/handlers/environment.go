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
		respondWithError(w, http.StatusBadRequest, "Invalid request body", "Please check your JSON payload", err)
		return
	}

	// TODO: Extract user ID from authentication context
	if req.UserID == "" {
		req.UserID = "default-user"
	}

	env, err := h.service.CreateEnvironment(r.Context(), &req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithSuccess(w, http.StatusCreated, "Workspace created successfully", map[string]interface{}{
		"environment": env,
		"message":     "Your development environment is ready to use",
	})
}

// GetEnvironment handles GET /api/v1/environments/{id}
func (h *EnvironmentHandler) GetEnvironment(w http.ResponseWriter, r *http.Request) {
	// GetEnvironment is removed - Next.js is the source of truth
	// Agent is stateless and doesn't store environment data
	err := models.ErrInvalidRequest("Agent is stateless - query Next.js for environment details")
	respondWithError(w, http.StatusNotImplemented, "Get Environment Not Supported", "This agent doesn't store state. Query Next.js API for environment details.", err)
}

// ListEnvironments handles GET /api/v1/environments
func (h *EnvironmentHandler) ListEnvironments(w http.ResponseWriter, r *http.Request) {
	// ListEnvironments is removed - Next.js is the source of truth
	// Agent is stateless and doesn't store environment data
	err := models.ErrInvalidRequest("Agent is stateless - query Next.js for environment list")
	respondWithError(w, http.StatusNotImplemented, "List Environments Not Supported", "This agent doesn't store state. Query Next.js API for environment list.", err)
}

// StartEnvironment handles POST /api/v1/environments/start
func (h *EnvironmentHandler) StartEnvironment(w http.ResponseWriter, r *http.Request) {
	var req models.StartEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", "Please check your JSON payload", err)
		return
	}

	if err := req.Validate(); err != nil {
		handleServiceError(w, err)
		return
	}

	env, err := h.service.StartEnvironment(r.Context(), &req)
	if err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithSuccess(w, http.StatusOK, "Workspace started successfully", map[string]interface{}{
		"environment": env,
		"message":     "Your workspace is now running with existing data",
	})
}

// StopEnvironment handles POST /api/v1/environments/stop
func (h *EnvironmentHandler) StopEnvironment(w http.ResponseWriter, r *http.Request) {
	var req models.StopEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", "Please check your JSON payload", err)
		return
	}

	if err := req.Validate(); err != nil {
		handleServiceError(w, err)
		return
	}

	if err := h.service.StopEnvironment(r.Context(), req.WorkspaceID, req.CloudRegion); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithSuccess(w, http.StatusOK, "Workspace stopped successfully", map[string]interface{}{
		"workspaceId": req.WorkspaceID,
		"message":     "Container deleted, volumes preserved. Restart anytime to resume work.",
	})
}

// ReportActivity handles POST /api/v1/environments/{id}/activity
func (h *EnvironmentHandler) ReportActivity(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	envID := vars["id"]

	var payload models.ActivityReport
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Request Body", "Please check your JSON payload", err)
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

	respondWithSuccess(w, http.StatusOK, "Activity recorded successfully", map[string]interface{}{
		"environmentId": payload.EnvironmentID,
		"snapshot":      payload.Snapshot,
		"timestamp":     payload.Timestamp,
	})
}

// DeleteEnvironment handles DELETE /api/v1/environments
func (h *EnvironmentHandler) DeleteEnvironment(w http.ResponseWriter, r *http.Request) {
	var req models.DeleteEnvironmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request body", "Please check your JSON payload", err)
		return
	}

	if err := req.Validate(); err != nil {
		handleServiceError(w, err)
		return
	}

	if err := h.service.DeleteEnvironment(r.Context(), req.WorkspaceID, req.CloudRegion, req.Force); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithSuccess(w, http.StatusOK, "Workspace deleted permanently", map[string]interface{}{
		"workspaceId": req.WorkspaceID,
		"message":     "All data and resources have been permanently removed",
	})
}

// Helper functions

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("❌ Error marshaling JSON: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithSuccess(w http.ResponseWriter, code int, message string, data interface{}) {
	respondWithJSON(w, code, models.SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func respondWithError(w http.ResponseWriter, code int, error string, message string, err error) {
	log.Printf("❌ %s: %v", error, err)
	respondWithJSON(w, code, models.ErrorResponse{
		Success: false,
		Error:   error,
		Message: message,
		Code:    fmt.Sprintf("ERR_%d", code),
	})
}

func handleServiceError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*models.AppError); ok {
		switch appErr.Code {
		case "INVALID_REQUEST":
			respondWithError(w, http.StatusBadRequest, "Invalid Request", appErr.Message, err)
		case "NOT_FOUND":
			respondWithError(w, http.StatusNotFound, "Resource Not Found", appErr.Message, err)
		case "UNAUTHORIZED":
			respondWithError(w, http.StatusUnauthorized, "Unauthorized", appErr.Message, err)
		case "CONFLICT":
			respondWithError(w, http.StatusConflict, "Conflict", appErr.Message, err)
		default:
			respondWithError(w, http.StatusInternalServerError, "Internal Server Error", "An unexpected error occurred. Please try again later.", err)
		}
	} else {
		respondWithError(w, http.StatusInternalServerError, "Internal Server Error", "An unexpected error occurred. Please try again later.", err)
	}
}
