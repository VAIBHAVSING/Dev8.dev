package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler_HealthCheck(t *testing.T) {
	handler := NewHealthHandler()

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	handler.HealthCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("HealthCheck() status = %v, want %v", w.Code, http.StatusOK)
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("HealthCheck() Content-Type = %v, want application/json", contentType)
	}
}

func TestHealthHandler_ReadinessCheck(t *testing.T) {
	handler := NewHealthHandler()

	req := httptest.NewRequest("GET", "/ready", nil)
	w := httptest.NewRecorder()

	handler.ReadinessCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("ReadinessCheck() status = %v, want %v", w.Code, http.StatusOK)
	}
}

func TestHealthHandler_LivenessCheck(t *testing.T) {
	handler := NewHealthHandler()

	req := httptest.NewRequest("GET", "/live", nil)
	w := httptest.NewRecorder()

	handler.LivenessCheck(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("LivenessCheck() status = %v, want %v", w.Code, http.StatusOK)
	}
}
