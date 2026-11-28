//go:build linux

package main

import (
	"os/exec"
	"syscall"
)

func configureTunnelProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Pdeathsig: syscall.SIGKILL}
}
func ownTunnelProcess(cmd *exec.Cmd) (func(), error) { return func() {}, nil }
