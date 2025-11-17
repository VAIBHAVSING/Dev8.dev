package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
)

// TimeoutMiddleware adds timeout to requests
func TimeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Create context with timeout
			ctx, cancel := context.WithTimeout(r.Context(), timeout)
			defer cancel()

			// Create a channel to signal completion
			done := make(chan struct{})

			// Run handler in goroutine
			go func() {
				defer close(done)
				next.ServeHTTP(w, r.WithContext(ctx))
			}()

			// Wait for completion or timeout
			select {
			case <-done:
				// Request completed successfully
				return
			case <-ctx.Done():
				// Timeout occurred
				if ctx.Err() == context.DeadlineExceeded {
					log := logger.FromContext(r.Context())
					log.Warn().
						Str("method", r.Method).
						Str("url", r.URL.String()).
						Dur("timeout", timeout).
						Msg("Request timeout")

					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusGatewayTimeout)

					response := map[string]any{
						"success": false,
						"error":   "Request Timeout",
						"message": "The request took too long to process. Please try again.",
						"code":    "ERR_504",
					}

					_ = json.NewEncoder(w).Encode(response)
				}
			}
		})
	}
}
