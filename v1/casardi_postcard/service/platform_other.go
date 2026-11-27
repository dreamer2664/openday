//go:build !windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

func openBrowser(uri string) error {
	if runtime.GOOS == "darwin" {
		return exec.Command("open", uri).Start()
	}
	return exec.Command("xdg-open", uri).Start()
}
func showError(message string) { fmt.Fprintln(os.Stderr, message) }
