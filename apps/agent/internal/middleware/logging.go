package middleware

import (
	"net/http"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
)

// LoggingMiddleware logs HTTP requests using structured logging
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		rw := &loggingResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		// Call the next handler
		next.ServeHTTP(rw, r)

		// Log the request with structured logging
		duration := time.Since(start)
		log := logger.FromContext(r.Context())

		log.Info().
			Str("method", r.Method).
			Str("url", r.RequestURI).
			Str("remote_addr", r.RemoteAddr).
			Int("status_code", rw.statusCode).
			Dur("duration", duration).
			Int64("request_size", r.ContentLength).
			Int("response_size", rw.size).
			Str("user_agent", r.UserAgent()).
			Msg("HTTP request completed")
	})
}

// loggingResponseWriter is a wrapper around http.ResponseWriter to capture status code and size
type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int
}

// WriteHeader captures the status code and calls the underlying WriteHeader
func (rw *loggingResponseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

// Write captures the response size and writes to the underlying writer
func (rw *loggingResponseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.size += size
	return size, err
}
