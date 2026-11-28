//go:build windows

package main

import (
	"fmt"
	"os/exec"
	"syscall"
	"unsafe"
)

func configureTunnelProcess(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
}

// A private kill-on-close Job Object prevents a tunnel surviving a crash or
// forced closure of its parent. No inherited handle or admin rights required.
func ownTunnelProcess(cmd *exec.Cmd) (func(), error) {
	kernel := syscall.NewLazyDLL("kernel32.dll")
	create := kernel.NewProc("CreateJobObjectW")
	set := kernel.NewProc("SetInformationJobObject")
	assign := kernel.NewProc("AssignProcessToJobObject")
	job, _, e := create.Call(0, 0)
	if job == 0 {
		return nil, fmt.Errorf("CreateJobObject: %v", e)
	}
	closeJob := func() { _ = syscall.CloseHandle(syscall.Handle(job)) }
	type basicLimits struct {
		ProcessTime, JobTime           int64
		Flags                          uint32
		MinWorkingSet, MaxWorkingSet   uintptr
		ActiveProcessLimit             uint32
		Affinity                       uintptr
		PriorityClass, SchedulingClass uint32
	}
	type extendedLimits struct {
		Basic                                                      basicLimits
		IOCounters                                                 [6]uint64
		ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory uintptr
	}
	info := extendedLimits{}
	info.Basic.Flags = 0x00002000 // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
	ok, _, e := set.Call(job, 9, uintptr(unsafe.Pointer(&info)), unsafe.Sizeof(info))
	if ok == 0 {
		closeJob()
		return nil, fmt.Errorf("SetInformationJobObject: %v", e)
	}
	process, e := syscall.OpenProcess(0x0100|0x0001, false, uint32(cmd.Process.Pid))
	if e != nil {
		closeJob()
		return nil, e
	}
	defer syscall.CloseHandle(process)
	ok, _, e = assign.Call(job, uintptr(process))
	if ok == 0 {
		closeJob()
		return nil, fmt.Errorf("AssignProcessToJobObject: %v", e)
	}
	return closeJob, nil
}
