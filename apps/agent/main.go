package main

import (
    "fmt"
    "log"
    "net/http"
    "os"
)

func main() {
    port := os.Getenv("AGENT_PORT")
    if port == "" {
        port = "8080"
    }

    http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        fmt.Printf("hii")
        _, _ = w.Write([]byte(`{"message": "Hello from Go Agent"}`))
    })

    log.Printf("Agent running on port %s", port)
    if err := http.ListenAndServe(":"+port, nil); err != nil {
        log.Fatal(err)
    }
}
