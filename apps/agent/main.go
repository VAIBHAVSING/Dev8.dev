package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

// Response represents a JSON response structure
type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

// healthHandler handles health check requests
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := Response{
		Message: "Agent is healthy",
		Status:  "ok",
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// helloHandler handles hello requests
func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := Response{
		Message: "Hello from Go Agent",
		Status:  "success",
	}

	log.Printf("Hello endpoint called from %s", r.RemoteAddr)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func main() {
	port := os.Getenv("AGENT_PORT")
	if port == "" {
		port = "8080"
	}

	// Register handlers
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		response := Response{
			Message: "Go Agent API",
			Status:  "running",
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		}
	})

	log.Printf("🚀 Agent starting on port %s", port)
	log.Printf("📊 Health check: http://localhost:%s/health", port)
	log.Printf("👋 Hello endpoint: http://localhost:%s/hello", port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
