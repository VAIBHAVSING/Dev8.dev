package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	httpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "endpoint", "status"},
	)

	httpRequestSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_size_bytes",
			Help:    "HTTP request size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 7),
		},
		[]string{"method", "endpoint"},
	)

	httpResponseSize = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: prometheus.ExponentialBuckets(100, 10, 7),
		},
		[]string{"method", "endpoint", "status"},
	)

	activeRequests = promauto.NewGauge(
		prometheus.GaugeOpts{
			Name: "http_requests_active",
			Help: "Number of active HTTP requests",
		},
	)
)

// responseWriter wraps http.ResponseWriter to capture status code and size
type metricsResponseWriter struct {
	http.ResponseWriter
	statusCode int
	size       int
}

func newMetricsResponseWriter(w http.ResponseWriter) *metricsResponseWriter {
	return &metricsResponseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (rw *metricsResponseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *metricsResponseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.size += size
	return size, err
}

// MetricsMiddleware collects HTTP metrics
func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Increment active requests
		activeRequests.Inc()
		defer activeRequests.Dec()

		// Wrap response writer
		mw := newMetricsResponseWriter(w)

		// Record request size
		requestSize := float64(r.ContentLength)
		if requestSize > 0 {
			httpRequestSize.WithLabelValues(r.Method, r.URL.Path).Observe(requestSize)
		}

		// Process request
		next.ServeHTTP(mw, r)

		// Record metrics
		duration := time.Since(start).Seconds()
		statusCode := strconv.Itoa(mw.statusCode)

		httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, statusCode).Inc()
		httpRequestDuration.WithLabelValues(r.Method, r.URL.Path, statusCode).Observe(duration)
		httpResponseSize.WithLabelValues(r.Method, r.URL.Path, statusCode).Observe(float64(mw.size))
	})
}
