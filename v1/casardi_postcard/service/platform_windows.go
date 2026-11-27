//go:build windows

package main

import (
	"os/exec"
	"syscall"
	"unsafe"
)

func openBrowser(uri string) error {
	cmd := exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", uri)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd.Start()
}
func showError(message string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	box := user32.NewProc("MessageBoxW")
	title, _ := syscall.UTF16PtrFromString("Cartolina Casardi · Avvio Windows")
	text, _ := syscall.UTF16PtrFromString(message)
	_, _, _ = box.Call(0, uintptr(unsafe.Pointer(text)), uintptr(unsafe.Pointer(title)), 0x10)
}
