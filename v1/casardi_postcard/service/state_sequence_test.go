package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInternetStateSequenceMonotonicAcrossReadsAndModeChanges(t *testing.T) {
	b := testBridge()
	b.internet = newInternetTunnel(b)
	b.mu.Lock()
	first := b.stateLocked(false)
	second := b.stateLocked(false)
	b.mu.Unlock()
	if second["state_seq"].(uint64) <= first["state_seq"].(uint64) {
		t.Fatal("state sequence did not advance")
	}
	b.internet.stop()
	b.mu.Lock()
	third := b.stateLocked(false)
	b.mu.Unlock()
	if third["state_seq"].(uint64) <= second["state_seq"].(uint64) {
		t.Fatal("stop did not get a newer state snapshot")
	}
	if first["generation"] != third["generation"] {
		t.Fatal("state polling resets postcard generation")
	}
}

func TestInternetExistingVersionGuard(t *testing.T) {
	for _, current := range []bool{false, true} {
		body := `{"app":"` + appID + `"}`
		if current {
			body = `{"app":"` + appID + `","bridge_revision":"` + bridgeRevision + `"}`
		}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte(body)) }))
		t.Setenv("CASARDI_PORT", strings.TrimPrefix(server.URL, "http://127.0.0.1:"))
		listener, _, existing, e := findListener()
		server.Close()
		if listener != nil {
			listener.Close()
			t.Fatal("opened a second listener")
		}
		if current {
			if e != nil || !existing {
				t.Fatal("current service not reused", e)
			}
		} else {
			if e == nil || existing || !strings.Contains(e.Error(), "versione precedente") {
				t.Fatal("silently reused old application", e)
			}
		}
	}
}
