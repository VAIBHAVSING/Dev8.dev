package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
)

// AuthMiddleware validates API keys for requests
type AuthMiddleware struct {
	apiKeys map[string]bool
	enabled bool
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(apiKeys []string) *AuthMiddleware {
	keyMap := make(map[string]bool)
	for _, key := range apiKeys {
		if key != "" {
			keyMap[key] = true
		}
	}

	return &AuthMiddleware{
		apiKeys: keyMap,
		enabled: len(keyMap) > 0,
	}
}

// Middleware validates the API key from the request
func (am *AuthMiddleware) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth if not enabled or for health check endpoints
		if !am.enabled || isHealthCheckEndpoint(r.URL.Path) {
			next.ServeHTTP(w, r)
			return
		}

		// Get API key from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			am.unauthorized(w, r, "Missing Authorization header")
			return
		}

		// Extract API key from Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			am.unauthorized(w, r, "Invalid Authorization header format. Expected: Bearer <api-key>")
			return
		}

		apiKey := parts[1]

		// Validate API key
		if !am.apiKeys[apiKey] {
			am.unauthorized(w, r, "Invalid API key")
			return
		}

		// API key is valid, continue
		next.ServeHTTP(w, r)
	})
}

func (am *AuthMiddleware) unauthorized(w http.ResponseWriter, r *http.Request, reason string) {
	log := logger.FromContext(r.Context())
	log.Warn().
		Str("method", r.Method).
		Str("url", r.URL.String()).
		Str("remote_addr", r.RemoteAddr).
		Str("reason", reason).
		Msg("Unauthorized request")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)

	response := map[string]any{
		"success": false,
		"error":   "Unauthorized",
		"message": "Invalid or missing API key. Please provide a valid API key in the Authorization header.",
		"code":    "ERR_401",
	}

	_ = json.NewEncoder(w).Encode(response)
}

// isHealthCheckEndpoint checks if the endpoint is a health check
func isHealthCheckEndpoint(path string) bool {
	healthPaths := []string{"/health", "/ready", "/live", "/metrics"}
	for _, hp := range healthPaths {
		if path == hp {
			return true
		}
	}
	return false
}
