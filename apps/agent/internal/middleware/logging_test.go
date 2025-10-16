package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLoggingMiddleware(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("test response"))
	})

	loggedHandler := LoggingMiddleware(handler)

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	loggedHandler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("LoggingMiddleware status = %v, want %v", w.Code, http.StatusOK)
	}

	if w.Body.String() != "test response" {
		t.Errorf("LoggingMiddleware body = %v, want 'test response'", w.Body.String())
	}
}

func TestLoggingMiddleware_DifferentMethods(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	})

	loggedHandler := LoggingMiddleware(handler)

	methods := []string{"GET", "POST", "PUT", "DELETE", "PATCH"}

	for _, method := range methods {
		t.Run(method, func(t *testing.T) {
			req := httptest.NewRequest(method, "/test", nil)
			w := httptest.NewRecorder()

			loggedHandler.ServeHTTP(w, req)

			if w.Code != http.StatusCreated {
				t.Errorf("LoggingMiddleware for %s status = %v, want %v", method, w.Code, http.StatusCreated)
			}
		})
	}
}
