package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/models"
	"github.com/gorilla/mux"
)

func TestRespondWithJSON(t *testing.T) {
	tests := []struct {
		name    string
		code    int
		payload interface{}
	}{
		{
			name:    "success response",
			code:    http.StatusOK,
			payload: map[string]string{"message": "success"},
		},
		{
			name:    "created response",
			code:    http.StatusCreated,
			payload: map[string]int{"id": 123},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			respondWithJSON(w, tt.code, tt.payload)

			if w.Code != tt.code {
				t.Errorf("respondWithJSON() status = %v, want %v", w.Code, tt.code)
			}

			contentType := w.Header().Get("Content-Type")
			if contentType != "application/json" {
				t.Errorf("respondWithJSON() Content-Type = %v, want application/json", contentType)
			}

			var response interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
				t.Errorf("respondWithJSON() body is not valid JSON: %v", err)
			}
		})
	}
}

func TestRespondWithError(t *testing.T) {
	w := httptest.NewRecorder()
	err := &testError{msg: "test error"}
	respondWithError(w, http.StatusBadRequest, "Bad request", "Invalid input provided", err)

	if w.Code != http.StatusBadRequest {
		t.Errorf("respondWithError() status = %v, want %v", w.Code, http.StatusBadRequest)
	}

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Errorf("respondWithError() body is not valid JSON: %v", err)
	}

	if response["error"] != "Bad request" {
		t.Errorf("respondWithError() error field = %v, want 'Bad request'", response["error"])
	}
}

type testError struct {
	msg string
}

func (e *testError) Error() string {
	return e.msg
}

func TestHandleServiceError(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
	}{
		{
			name:       "invalid request error",
			err:        &models.AppError{Code: "INVALID_REQUEST", Message: "invalid"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "not found error",
			err:        &models.AppError{Code: "NOT_FOUND", Message: "not found"},
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "unauthorized error",
			err:        &models.AppError{Code: "UNAUTHORIZED", Message: "unauthorized"},
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "generic error",
			err:        &testError{msg: "generic error"},
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			handleServiceError(w, tt.err)

			if w.Code != tt.wantStatus {
				t.Errorf("handleServiceError() status = %v, want %v", w.Code, tt.wantStatus)
			}
		})
	}
}

// Need to import models package
func TestEnvironmentHandler_Routes(t *testing.T) {
	// Create a mock environment service (would need proper mocking in production)
	handler := &EnvironmentHandler{}

	tests := []struct {
		name      string
		method    string
		path      string
		body      interface{}
		setupVars func(*http.Request) *http.Request
	}{
		{
			name:   "list environments",
			method: "GET",
			path:   "/api/v1/environments",
			body:   nil,
		},
		{
			name:   "create environment",
			method: "POST",
			path:   "/api/v1/environments",
			body: models.CreateEnvironmentRequest{
				Name:        "test",
				CloudRegion: "eastus",
				CPUCores:    2,
				MemoryGB:    4,
				StorageGB:   100,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var body []byte
			var err error
			if tt.body != nil {
				body, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("Failed to marshal body: %v", err)
				}
			}

			req := httptest.NewRequest(tt.method, tt.path, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			if tt.setupVars != nil {
				req = tt.setupVars(req)
			}

			w := httptest.NewRecorder()

			// Note: This is a basic structure test
			// In a real test, you'd call the actual handler methods
			if tt.method == "GET" && tt.path == "/api/v1/environments" {
				handler.ListEnvironments(w, req)
			}
		})
	}
}

func TestRouteParameterExtraction(t *testing.T) {
	router := mux.NewRouter()
	var capturedID string

	router.HandleFunc("/api/v1/environments/{id}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		capturedID = vars["id"]
		w.WriteHeader(http.StatusOK)
	}).Methods("GET")

	req := httptest.NewRequest("GET", "/api/v1/environments/env-123", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	if capturedID != "env-123" {
		t.Errorf("Route parameter extraction: got %v, want env-123", capturedID)
	}
}
