package middleware

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
	"golang.org/x/time/rate"
)

// RateLimiter manages rate limiting for clients
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rps      rate.Limit
	burst    int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rps int, burst int) *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      rate.Limit(rps),
		burst:    burst,
	}
}

// getLimiter returns a rate limiter for a client
func (rl *RateLimiter) getLimiter(clientID string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	limiter, exists := rl.limiters[clientID]
	if !exists {
		limiter = rate.NewLimiter(rl.rps, rl.burst)
		rl.limiters[clientID] = limiter
	}

	return limiter
}

// RateLimitMiddleware limits the number of requests per client
func (rl *RateLimiter) RateLimitMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use IP address as client ID
		clientID := r.RemoteAddr

		// Get limiter for this client
		limiter := rl.getLimiter(clientID)

		// Check if request is allowed
		if !limiter.Allow() {
			log := logger.FromContext(r.Context())
			log.Warn().
				Str("client_id", clientID).
				Str("method", r.Method).
				Str("url", r.URL.String()).
				Msg("Rate limit exceeded")

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)

			response := map[string]any{
				"success": false,
				"error":   "Rate Limit Exceeded",
				"message": "Too many requests. Please try again later.",
				"code":    "ERR_429",
			}

			_ = json.NewEncoder(w).Encode(response)
			return
		}

		next.ServeHTTP(w, r)
	})
}
