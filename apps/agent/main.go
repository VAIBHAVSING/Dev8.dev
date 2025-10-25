package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/handlers"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/middleware"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/services"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file if present
	_ = godotenv.Load()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	log.Printf("🔧 Configuration loaded successfully")
	log.Printf("📍 Enabled regions: %d", len(cfg.GetEnabledRegions()))
	for _, region := range cfg.GetEnabledRegions() {
		log.Printf("   - %s (%s)", region.Name, region.Location)
	}
	log.Printf("🔒 CORS allowed origins: %v", cfg.CORSAllowedOrigins)

	// Initialize Azure client
	azureClient, err := azure.NewClient(cfg)
	if err != nil {
		log.Fatalf("Failed to create Azure client: %v", err)
	}
	log.Printf("☁️  Azure client initialized successfully")

	// Initialize environment service
	envService, err := services.NewEnvironmentService(cfg, azureClient)
	if err != nil {
		log.Fatalf("Failed to create environment service: %v", err)
	}
	log.Printf("🚀 Environment service initialized (stateless)")
	// No need to defer Close() - nothing to close

	// Initialize handlers
	envHandler := handlers.NewEnvironmentHandler(envService)
	healthHandler := handlers.NewHealthHandler()

	// Setup router
	router := mux.NewRouter()

	// Apply middleware
	router.Use(middleware.LoggingMiddleware)
	router.Use(middleware.CORSMiddleware(cfg.CORSAllowedOrigins))

	// Health check routes
	router.HandleFunc("/health", healthHandler.HealthCheck).Methods("GET")
	router.HandleFunc("/ready", healthHandler.ReadinessCheck).Methods("GET")
	router.HandleFunc("/live", healthHandler.LivenessCheck).Methods("GET")

	// API v1 routes
	api := router.PathPrefix("/api/v1").Subrouter()

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
		w.Write([]byte(`{
			"service": "dev8-agent",
			"version": "1.0.0",
			"status": "running",
			"endpoints": {
				"health": "/health",
				"api": "/api/v1"
			}
		}`))
	}).Methods("GET")

	// Create HTTP server
	addr := cfg.Host + ":" + cfg.Port
	srv := &http.Server{
		Addr:         addr,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on %s", addr)
		log.Printf("📊 Health check: http://%s/health", addr)
		log.Printf("📡 API endpoint: http://%s/api/v1", addr)
		log.Printf("🌍 Environment: %s", cfg.Environment)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server stopped")
}
