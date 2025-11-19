package middleware

import (
	"net/http"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
	"github.com/google/uuid"
)

// RequestIDHeader is the header key for request ID
const RequestIDHeader = "X-Request-ID"

// RequestIDMiddleware adds a unique request ID to each request
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check if request ID already exists in header
		requestID := r.Header.Get(RequestIDHeader)
		if requestID == "" {
			// Generate new UUID for request ID
			requestID = uuid.New().String()
		}

		// Add request ID to response header
		w.Header().Set(RequestIDHeader, requestID)

		// Add request ID to context
		ctx := logger.WithRequestID(r.Context(), requestID)
		r = r.WithContext(ctx)

		// Continue to next handler
		next.ServeHTTP(w, r)
	})
}
