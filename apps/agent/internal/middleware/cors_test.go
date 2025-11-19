package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSMiddleware(t *testing.T) {
	allowedOrigins := []string{"https://dev8.dev", "http://localhost:3000"}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	corsHandler := CORSMiddleware(allowedOrigins)(handler)

	tests := []struct {
		name        string
		origin      string
		method      string
		wantAllowed bool
	}{
		{
			name:        "allowed origin",
			origin:      "https://dev8.dev",
			method:      "GET",
			wantAllowed: true,
		},
		{
			name:        "another allowed origin",
			origin:      "http://localhost:3000",
			method:      "GET",
			wantAllowed: true,
		},
		{
			name:        "disallowed origin",
			origin:      "https://evil.com",
			method:      "GET",
			wantAllowed: false,
		},
		{
			name:        "preflight request",
			origin:      "https://dev8.dev",
			method:      "OPTIONS",
			wantAllowed: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			req.Header.Set("Origin", tt.origin)

			if tt.method == "OPTIONS" {
				req.Header.Set("Access-Control-Request-Method", "POST")
			}

			w := httptest.NewRecorder()
			corsHandler.ServeHTTP(w, req)

			allowOrigin := w.Header().Get("Access-Control-Allow-Origin")

			if tt.wantAllowed {
				if allowOrigin != tt.origin && allowOrigin != "*" {
					t.Errorf("CORS header not set for allowed origin %s", tt.origin)
				}
			}

			if tt.method == "OPTIONS" && w.Code != http.StatusOK {
				t.Errorf("Preflight request status = %v, want %v", w.Code, http.StatusOK)
			}
		})
	}
}

func TestCORSMiddleware_NoOrigin(t *testing.T) {
	allowedOrigins := []string{"https://dev8.dev"}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	corsHandler := CORSMiddleware(allowedOrigins)(handler)

	req := httptest.NewRequest("GET", "/test", nil)
	// No Origin header set

	w := httptest.NewRecorder()
	corsHandler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Request without origin status = %v, want %v", w.Code, http.StatusOK)
	}
}
