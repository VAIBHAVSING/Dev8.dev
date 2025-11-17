package middleware

import (
	"encoding/json"
	"net/http"
	"runtime/debug"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
)

// RecoveryMiddleware recovers from panics and returns a 500 error
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Log the panic with stack trace
				log := logger.FromContext(r.Context())
				log.Error().
					Interface("panic", err).
					Str("method", r.Method).
					Str("url", r.URL.String()).
					Str("remote_addr", r.RemoteAddr).
					Bytes("stack_trace", debug.Stack()).
					Msg("Panic recovered")

				// Return error response
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)

				response := map[string]any{
					"success": false,
					"error":   "Internal Server Error",
					"message": "An unexpected error occurred. The error has been logged and will be investigated.",
					"code":    "ERR_500",
				}

				_ = json.NewEncoder(w).Encode(response)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
