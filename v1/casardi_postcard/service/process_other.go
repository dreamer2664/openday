//go:build !windows && !linux

package main

import "os/exec"

func configureTunnelProcess(cmd *exec.Cmd)           {}
func ownTunnelProcess(cmd *exec.Cmd) (func(), error) { return func() {}, nil }
