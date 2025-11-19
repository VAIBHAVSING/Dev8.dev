package logger

import (
	"context"
	"io"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

type contextKey string

const (
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
)

var logger zerolog.Logger

// Init initializes the global logger
func Init(level string, pretty bool) {
	// Configure time format
	zerolog.TimeFieldFormat = time.RFC3339

	var output io.Writer = os.Stdout
	if pretty {
		output = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
	}

	// Parse log level
	logLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		logLevel = zerolog.InfoLevel
	}

	logger = zerolog.New(output).
		Level(logLevel).
		With().
		Timestamp().
		Caller().
		Logger()

	// Set as global logger
	log.Logger = logger
}

// Get returns the global logger
func Get() zerolog.Logger {
	return logger
}

// FromContext returns a logger with context fields
func FromContext(ctx context.Context) zerolog.Logger {
	l := logger

	if requestID, ok := ctx.Value(requestIDKey).(string); ok && requestID != "" {
		l = l.With().Str("request_id", requestID).Logger()
	}

	if userID, ok := ctx.Value(userIDKey).(string); ok && userID != "" {
		l = l.With().Str("user_id", userID).Logger()
	}

	return l
}

// WithRequestID adds a request ID to the context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

// WithUserID adds a user ID to the context
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// Debug logs a debug message
func Debug(msg string) *zerolog.Event {
	return logger.Debug()
}

// Info logs an info message
func Info(msg string) *zerolog.Event {
	return logger.Info()
}

// Warn logs a warning message
func Warn(msg string) *zerolog.Event {
	return logger.Warn()
}

// Error logs an error message
func Error(msg string) *zerolog.Event {
	return logger.Error()
}

// Fatal logs a fatal message and exits
func Fatal(msg string) *zerolog.Event {
	return logger.Fatal()
}

// WithError returns a logger with error context
func WithError(err error) *zerolog.Event {
	return logger.Error().Err(err)
}
