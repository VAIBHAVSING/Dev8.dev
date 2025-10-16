package monitor

import (
	"sync"
	"testing"
	"time"
)

func TestState_UpdateIDE(t *testing.T) {
	state := &State{}
	now := time.Now()

	state.UpdateIDE(now, 2)

	snapshot := state.Snapshot()
	if snapshot.ActiveIDE != 2 {
		t.Errorf("UpdateIDE() ActiveIDE = %v, want 2", snapshot.ActiveIDE)
	}

	if snapshot.LastIDEActivity.IsZero() {
		t.Error("UpdateIDE() LastIDEActivity is zero")
	}
}

func TestState_UpdateSSH(t *testing.T) {
	state := &State{}
	now := time.Now()

	state.UpdateSSH(now, 1)

	snapshot := state.Snapshot()
	if snapshot.ActiveSSH != 1 {
		t.Errorf("UpdateSSH() ActiveSSH = %v, want 1", snapshot.ActiveSSH)
	}

	if snapshot.LastSSHActivity.IsZero() {
		t.Error("UpdateSSH() LastSSHActivity is zero")
	}
}

func TestState_Snapshot(t *testing.T) {
	state := &State{}
	now := time.Now()

	state.UpdateIDE(now, 3)
	state.UpdateSSH(now, 2)

	snapshot := state.Snapshot()

	if snapshot.ActiveIDE != 3 {
		t.Errorf("Snapshot() ActiveIDE = %v, want 3", snapshot.ActiveIDE)
	}

	if snapshot.ActiveSSH != 2 {
		t.Errorf("Snapshot() ActiveSSH = %v, want 2", snapshot.ActiveSSH)
	}

	if snapshot.LastIDEActivity.IsZero() {
		t.Error("Snapshot() LastIDEActivity is zero")
	}

	if snapshot.LastSSHActivity.IsZero() {
		t.Error("Snapshot() LastSSHActivity is zero")
	}
}

func TestState_ConcurrentAccess(t *testing.T) {
	state := &State{}
	var wg sync.WaitGroup

	// Test concurrent updates
	for i := 0; i < 100; i++ {
		wg.Add(2)
		go func(count int) {
			defer wg.Done()
			state.UpdateIDE(time.Now(), count)
		}(i)
		go func(count int) {
			defer wg.Done()
			state.UpdateSSH(time.Now(), count)
		}(i)
	}

	// Test concurrent reads
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_ = state.Snapshot()
		}()
	}

	wg.Wait()
	// If we get here without a race condition, the test passes
}

func TestSnapshot_Immutability(t *testing.T) {
	state := &State{}
	now := time.Now()

	state.UpdateIDE(now, 5)
	state.UpdateSSH(now, 3)

	snapshot1 := state.Snapshot()
	snapshot2 := state.Snapshot()

	// Verify snapshots are equal
	if snapshot1.ActiveIDE != snapshot2.ActiveIDE {
		t.Error("Snapshots should be equal")
	}

	// Update state
	state.UpdateIDE(now.Add(time.Second), 10)

	snapshot3 := state.Snapshot()

	// New snapshot should reflect the update
	if snapshot3.ActiveIDE != 10 {
		t.Errorf("Snapshot() after update ActiveIDE = %v, want 10", snapshot3.ActiveIDE)
	}

	// Old snapshots should be unchanged
	if snapshot1.ActiveIDE != 5 {
		t.Error("Previous snapshots should be immutable")
	}
}

func TestState_ZeroValues(t *testing.T) {
	state := &State{}
	
	snapshot := state.Snapshot()

	if snapshot.ActiveIDE != 0 {
		t.Errorf("New state ActiveIDE = %v, want 0", snapshot.ActiveIDE)
	}

	if snapshot.ActiveSSH != 0 {
		t.Errorf("New state ActiveSSH = %v, want 0", snapshot.ActiveSSH)
	}

	if !snapshot.LastIDEActivity.IsZero() {
		t.Error("New state LastIDEActivity should be zero")
	}

	if !snapshot.LastSSHActivity.IsZero() {
		t.Error("New state LastSSHActivity should be zero")
	}
}

func TestState_ActivityTracking(t *testing.T) {
	state := &State{}
	
	time1 := time.Now()
	state.UpdateIDE(time1, 1)
	
	time.Sleep(10 * time.Millisecond)
	
	time2 := time.Now()
	state.UpdateIDE(time2, 2)

	snapshot := state.Snapshot()

	// Should track the most recent activity
	if snapshot.LastIDEActivity.Before(time1) {
		t.Error("LastIDEActivity should be updated to most recent time")
	}
}
