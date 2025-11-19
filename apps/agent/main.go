package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/handlers"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/logger"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/middleware"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/services"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func main() {
	// Load environment variables from .env file if present
	_ = godotenv.Load()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration").Err(err).Send()
	}

	// Initialize logger with structured logging
	isPretty := cfg.Environment == "development"
	logger.Init(cfg.LogLevel, isPretty)
	log := logger.Get()

	log.Info().
		Str("version", "2.0.0").
		Str("environment", cfg.Environment).
		Str("port", cfg.Port).
		Msg("Starting Dev8 Agent")

	log.Info().
		Int("regions", len(cfg.GetEnabledRegions())).
		Msg("Configuration loaded successfully")

	for _, region := range cfg.GetEnabledRegions() {
		log.Info().
			Str("region_name", region.Name).
			Str("region_location", region.Location).
			Msg("Enabled region")
	}

	log.Info().
		Strs("cors_origins", cfg.CORSAllowedOrigins).
		Msg("CORS configuration")

	// Log container registry configuration
	if cfg.Azure.ContainerRegistry != "" {
		log.Info().
			Str("registry", "ACR").
			Str("url", cfg.Azure.ContainerRegistry).
			Str("image", cfg.Azure.ContainerRegistry+"/dev8-workspace:latest").
			Msg("Container registry configuration")
	} else {
		log.Info().
			Str("registry", "Docker Hub").
			Str("image", cfg.ContainerImage).
			Msg("Container registry configuration")
	}

	// Initialize Azure client
	azureClient, err := azure.NewClient(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create Azure client")
	}
	log.Info().Msg("Azure client initialized successfully")

	// Initialize environment service
	envService, err := services.NewEnvironmentService(cfg, azureClient)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to create environment service")
	}
	log.Info().Msg("Environment service initialized (stateless)")

	// Initialize handlers
	envHandler := handlers.NewEnvironmentHandler(envService)
	healthHandler := handlers.NewHealthHandler(azureClient, cfg)

	// Setup router
	router := mux.NewRouter()

	// Create middleware instances
	rateLimiter := middleware.NewRateLimiter(cfg.RateLimitRPS, cfg.RateLimitBurst)
	authMiddleware := middleware.NewAuthMiddleware(cfg.APIKeys)

	// Apply global middleware (order matters!)
	router.Use(middleware.RecoveryMiddleware)                     // Catch panics first
	router.Use(middleware.RequestIDMiddleware)                    // Add request ID to all requests
	router.Use(middleware.MetricsMiddleware)                      // Collect metrics
	router.Use(middleware.LoggingMiddleware)                      // Log requests
	router.Use(middleware.CORSMiddleware(cfg.CORSAllowedOrigins)) // Handle CORS
	router.Use(rateLimiter.RateLimitMiddleware)                   // Rate limiting
	router.Use(authMiddleware.Middleware)                         // Authentication (skips health endpoints)

	// Health check routes (no timeout)
	router.HandleFunc("/health", healthHandler.HealthCheck).Methods("GET")
	router.HandleFunc("/ready", healthHandler.ReadinessCheck).Methods("GET")
	router.HandleFunc("/live", healthHandler.LivenessCheck).Methods("GET")

	// Metrics endpoint for Prometheus
	router.Handle("/metrics", promhttp.Handler()).Methods("GET")

	// API v1 routes with timeout middleware
	api := router.PathPrefix("/api/v1").Subrouter()
	api.Use(middleware.TimeoutMiddleware(cfg.RequestTimeout))

	// Environment routes
	api.HandleFunc("/environments", envHandler.CreateEnvironment).Methods("POST")
	api.HandleFunc("/environments", envHandler.ListEnvironments).Methods("GET")
	api.HandleFunc("/environments/{id}", envHandler.GetEnvironment).Methods("GET")
	api.HandleFunc("/environments", envHandler.DeleteEnvironment).Methods("DELETE")
	api.HandleFunc("/environments/start", envHandler.StartEnvironment).Methods("POST")
	api.HandleFunc("/environments/stop", envHandler.StopEnvironment).Methods("POST")
	api.HandleFunc("/environments/{id}/activity", envHandler.ReportActivity).Methods("POST")

	// Root route
	router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{
			"service": "dev8-agent",
			"version": "1.0.0",
			"status": "running",
			"endpoints": {
				"health": "/health",
				"api": "/api/v1"
			}
		}`))
	}).Methods("GET")

	// Create HTTP server with production settings
	addr := cfg.Host + ":" + cfg.Port
	srv := &http.Server{
		Addr:              addr,
		Handler:           router,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		ReadHeaderTimeout: 10 * time.Second,
		MaxHeaderBytes:    1 << 20, // 1 MB
	}

	// Start server in a goroutine
	go func() {
		log.Info().
			Str("address", addr).
			Str("environment", cfg.Environment).
			Int("rate_limit_rps", cfg.RateLimitRPS).
			Bool("auth_enabled", len(cfg.APIKeys) > 0).
			Msg("Server starting")

		log.Info().
			Str("health_check", "http://"+addr+"/health").
			Str("readiness_check", "http://"+addr+"/ready").
			Str("liveness_check", "http://"+addr+"/live").
			Str("metrics", "http://"+addr+"/metrics").
			Str("api_endpoint", "http://"+addr+"/api/v1").
			Msg("Endpoints available")

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutdown signal received, gracefully shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server stopped gracefully")
}
