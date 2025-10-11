package logger

import (
	"io"
	"log/slog"
	"os"
	"path/filepath"
)

// New constructs a slog.Logger writing to stdout and an optional file path.
func New(logFilePath string) (*slog.Logger, func() error, error) {
	var writers []io.Writer
	writers = append(writers, os.Stdout)

	var file *os.File
	var err error

	if logFilePath != "" {
		dir := filepath.Dir(logFilePath)
		if err = os.MkdirAll(dir, 0o755); err != nil {
			return nil, nil, err
		}
		file, err = os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
		if err != nil {
			return nil, nil, err
		}
		writers = append(writers, file)
	}

	logger := slog.New(slog.NewTextHandler(io.MultiWriter(writers...), &slog.HandlerOptions{Level: slog.LevelInfo}))

	cleanup := func() error {
		if file != nil {
			return file.Close()
		}
		return nil
	}

	return logger, cleanup, nil
}
