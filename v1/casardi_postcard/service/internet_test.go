package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func publicTest(t *testing.T) (*Bridge, *InternetTunnel, http.Handler) {
	t.Helper()
	b := testBridge()
	m := newInternetTunnel(b)
	b.internet = m
	m.run = 1
	m.state = InternetState{Status: "ready", URL: "https://casardi-test.trycloudflare.com"}
	return b, m, m.publicHandler(1, "proof-secret")
}
func callPublic(h http.Handler, method, path string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "http://localhost"+path, nil)
	r.RemoteAddr = "127.0.0.1:1000"
	r.Header.Set("X-Forwarded-For", "127.0.0.1")
	r.Header.Set("CF-Connecting-IP", "127.0.0.1")
	w := httptest.NewRecorder()
	h.ServeHTTP(w, r)
	return w
}
func TestInternetPublicListenerHasNoAdminOrCreator(t *testing.T) {
	b, _, h := publicTest(t)
	uploadGood(t, b)
	for _, p := range []string{"/", "/telefono", "/health", "/bridge/state", "/bridge/reset", "/bridge/stop", "/bridge/internet", "/service/main.go", "/tunnel-health/wrong"} {
		for _, method := range []string{"GET", "POST", "HEAD"} {
			r := httptest.NewRequest(method, "http://localhost"+p, nil)
			r.RemoteAddr = "127.0.0.1:1000"
			r.Header.Set("X-Casardi-Key", b.key)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != 404 || strings.Contains(w.Body.String(), b.key) {
				t.Fatalf("%s %s exposed: %d", method, p, w.Code)
			}
		}
	}
}
func TestInternetPublicDownloadExactAndDisclosed(t *testing.T) {
	b, _, h := publicTest(t)
	uploadGood(t, b)
	p := pathFor(b)
	w := callPublic(h, "GET", p+"/file")
	if w.Code != 200 || !bytes.Equal(w.Body.Bytes(), fixture()) {
		t.Fatal("public PNG differs")
	}
	if w.Header().Get("Cache-Control") != "no-store, max-age=0" || !strings.Contains(w.Header().Get("X-Robots-Tag"), "noindex") {
		t.Fatal("missing privacy headers")
	}
	w = callPublic(h, "GET", p)
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Cloudflare") || strings.Contains(w.Body.String(), "Nessun account, cloud") {
		t.Fatal("public transfer not disclosed")
	}
	if w = callPublic(h, "HEAD", p+"/file"); w.Code != 200 || w.Body.Len() != 0 {
		t.Fatal("bad HEAD")
	}
	for _, method := range []string{"POST", "PUT", "DELETE", "OPTIONS"} {
		if callPublic(h, method, p+"/file").Code != 405 {
			t.Fatal("public write allowed")
		}
	}
}
func TestInternetPublicResetExpiryAndStop(t *testing.T) {
	b, m, h := publicTest(t)
	uploadGood(t, b)
	p := pathFor(b)
	b.card.Expires = time.Now().Add(-time.Second)
	if callPublic(h, "GET", p+"/file").Code != 410 {
		t.Fatal("expired public PNG")
	}
	uploadGood(t, b)
	p = pathFor(b)
	if req(b, "POST", "/bridge/reset", nil, true).Code != 200 || callPublic(h, "GET", p).Code != 410 {
		t.Fatal("reset did not revoke public QR")
	}
	m.stop()
	if callPublic(h, "GET", "/tunnel-health/proof-secret").Code != 404 || callPublic(h, "GET", p).Code != 404 {
		t.Fatal("stopped listener still active")
	}
	if m.update(1, "ready", "stale", "https://old.trycloudflare.com") {
		t.Fatal("stale worker reactivated URL")
	}
}
func TestInternetPublicProbeAndNotReady(t *testing.T) {
	b, m, h := publicTest(t)
	uploadGood(t, b)
	w := callPublic(h, "GET", "/tunnel-health/proof-secret")
	if w.Code != 200 || w.Body.String() != "casardi-download-proof-secret" {
		t.Fatal("probe")
	}
	m.update(1, "reconnecting", "wait", "")
	if callPublic(h, "GET", pathFor(b)).Code != 503 {
		t.Fatal("unverified URL serves public download")
	}
}
func TestInternetStateDoesNotInventLANFallback(t *testing.T) {
	b, m, _ := publicTest(t)
	d := uploadGood(t, b)
	if d["transfer_mode"] != "internet" || !strings.HasPrefix(d["transfer"].(map[string]any)["url"].(string), "https://casardi-test.trycloudflare.com/download/") {
		t.Fatal("wrong public QR")
	}
	if !strings.HasPrefix(d["creator_url"].(string), "http://192.168.50.23:") {
		t.Fatal("creator incorrectly exposed")
	}
	m.update(1, "error", "blocked", "")
	b.mu.Lock()
	state := b.stateLocked(false)
	b.mu.Unlock()
	if state["transfer"].(map[string]any)["url"] != "" || state["transfer_mode"] != "internet" {
		t.Fatal("misleading fallback to LAN")
	}
	m.stop()
	b.mu.Lock()
	state = b.stateLocked(false)
	b.mu.Unlock()
	if state["transfer_mode"] != "lan" || !strings.HasPrefix(state["transfer"].(map[string]any)["url"].(string), "http://192.168.50.23:") {
		t.Fatal("explicit LAN restoration")
	}
}
func TestInternetQuickURLStrictAllowList(t *testing.T) {
	for _, s := range []string{"https://one-two.trycloudflare.com", "https://a.trycloudflare.com"} {
		if !validQuickURL(s) {
			t.Fatal(s)
		}
	}
	for _, s := range []string{"", "http://a.trycloudflare.com", "https://trycloudflare.com", "https://a.trycloudflare.com.evil.test", "https://a.trycloudflare.com:444", "https://a.trycloudflare.com/", "https://a.trycloudflare.com?q=1", "https://a.trycloudflare.com#x", "https://user@a.trycloudflare.com", "https://127.0.0.1", "https://-bad.trycloudflare.com"} {
		if validQuickURL(s) {
			t.Fatal("accepted " + s)
		}
	}
}
func TestInternetPinnedArtifacts(t *testing.T) {
	a, e := cloudflaredArtifact("windows", "amd64")
	if e != nil || a.bytes != 55470800 || len(a.digest) != 64 {
		t.Fatal(a, e)
	}
	if _, e = cloudflaredArtifact("windows", "386"); e == nil {
		t.Fatal("unsupported arch")
	}
}
func TestInternetDownloaderChecksumAtomicAndSize(t *testing.T) {
	body := []byte("official-tool-for-unit-test")
	sum := sha256.Sum256(body)
	a := toolArtifact{"tool", hex.EncodeToString(sum[:]), int64(len(body))}
	for _, kind := range []string{"good", "bad-hash", "oversize", "short", "http-error"} {
		t.Run(kind, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if kind == "http-error" {
					w.WriteHeader(403)
					return
				}
				data := append([]byte(nil), body...)
				switch kind {
				case "bad-hash":
					data[0] ^= 1
				case "oversize":
					data = append(data, 'x')
				case "short":
					data = data[:2]
				}
				_, _ = w.Write(data)
			}))
			defer server.Close()
			dir := t.TempDir()
			dest := filepath.Join(dir, "tool")
			e := downloadTool(context.Background(), server.Client(), server.URL, dest, a)
			if kind == "good" {
				if e != nil || !verifiedTool(dest, a) {
					t.Fatal("valid tool rejected", e)
				}
			} else {
				if e == nil {
					t.Fatal("invalid tool accepted")
				}
				if _, e = os.Stat(dest); !os.IsNotExist(e) {
					t.Fatal("invalid tool materialized")
				}
			}
			items, _ := os.ReadDir(dir)
			for _, f := range items {
				if strings.HasSuffix(f.Name(), ".part") {
					t.Fatal("partial file left behind")
				}
			}
		})
	}
}
func TestInternetDownloadCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	dir := t.TempDir()
	a := toolArtifact{"tool", strings.Repeat("0", 64), 1}
	if downloadTool(ctx, http.DefaultClient, "http://127.0.0.1:1", filepath.Join(dir, "tool"), a) == nil {
		t.Fatal("cancelled download")
	}
	items, _ := os.ReadDir(dir)
	if len(items) != 0 {
		t.Fatal("cancelled download wrote disk file")
	}
}
func TestInternetDoesNotStartWithoutOptInAndStartsOnce(t *testing.T) {
	b := testBridge()
	m := newInternetTunnel(b)
	b.internet = m
	var calls atomic.Int32
	began := make(chan struct{})
	done := make(chan struct{})
	m.ensure = func(ctx context.Context) (string, error) {
		calls.Add(1)
		close(began)
		<-ctx.Done()
		close(done)
		return "", ctx.Err()
	}
	if m.snapshot().Status != "off" || calls.Load() != 0 {
		t.Fatal("auto-started")
	}
	m.start()
	<-began
	m.start()
	if calls.Load() != 1 {
		t.Fatal("duplicate helper startup")
	}
	m.stop()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("download not cancelled")
	}
	time.Sleep(10 * time.Millisecond)
	if m.snapshot().Status != "off" {
		t.Fatal("cancelled callback overwrote state")
	}
}
func TestInternetAPIIsOwnerOnlyAndStrict(t *testing.T) {
	b := testBridge()
	m := newInternetTunnel(b)
	b.internet = m
	for _, p := range []struct {
		method, body, ctype string
		key                 bool
		code                int
	}{
		{"POST", `{"action":"stop"}`, "application/json", false, 403},
		{"GET", "", "", true, 405},
		{"POST", `{"action":"stop"}`, "text/plain", true, 415},
		{"POST", `{"action":"stop","extra":1}`, "application/json", true, 400},
		{"POST", `{"action":"stop"} {}`, "application/json", true, 400},
		{"POST", `{"action":"bad"}`, "application/json", true, 400},
		{"POST", `{"action":"stop"}`, "application/json", true, 200},
	} {
		r := httptest.NewRequest(p.method, "http://127.0.0.1:8083/bridge/internet", strings.NewReader(p.body))
		r.RemoteAddr = "127.0.0.1:1000"
		r.Header.Set("Content-Type", p.ctype)
		if p.key {
			r.Header.Set("X-Casardi-Key", b.key)
		}
		w := httptest.NewRecorder()
		b.ServeHTTP(w, r)
		if w.Code != p.code {
			t.Fatalf("%+v: %d %s", p, w.Code, w.Body.String())
		}
	}
	r := httptest.NewRequest("POST", "http://127.0.0.1:8083/bridge/internet", strings.NewReader(`{"action":"stop"}`))
	r.RemoteAddr = "127.0.0.1:1000"
	r.Header.Set("X-Casardi-Key", b.key)
	r.Header.Set("Origin", "https://evil.test")
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	b.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("cross-origin allowed")
	}
}
func TestInternetEnvironmentDoesNotInheritTunnelConfig(t *testing.T) {
	t.Setenv("TUNNEL_URL", "http://evil")
	t.Setenv("TUNNEL_TOKEN", "secret")
	t.Setenv("NO_TLS_VERIFY", "true")
	for _, e := range cloudflaredEnv() {
		if strings.HasPrefix(e, "TUNNEL_") || strings.HasPrefix(e, "NO_TLS_VERIFY=") {
			t.Fatal("untrusted tunnel configuration inherited")
		}
	}
}

type heldWriter struct {
	header  http.Header
	entered chan struct{}
	release <-chan struct{}
	once    sync.Once
}

func (w *heldWriter) Header() http.Header { return w.header }
func (w *heldWriter) WriteHeader(int)     {}
func (w *heldWriter) Write(p []byte) (int, error) {
	w.once.Do(func() { close(w.entered) })
	<-w.release
	return len(p), nil
}
func TestInternetPublicConcurrencyIsBounded(t *testing.T) {
	b, _, h := publicTest(t)
	uploadGood(t, b)
	path := pathFor(b) + "/file"
	release := make(chan struct{})
	defer close(release)
	for i := 0; i < 2; i++ {
		w := &heldWriter{make(http.Header), make(chan struct{}), release, sync.Once{}}
		go h.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		select {
		case <-w.entered:
		case <-time.After(time.Second):
			t.Fatal("download did not enter")
		}
	}
	if callPublic(h, "GET", path).Code != 429 {
		t.Fatal("unbounded public downloads")
	}
}
func TestInternetJSONStateDoesNotContainProbeOrOwnerKey(t *testing.T) {
	b, _, _ := publicTest(t)
	b.mu.Lock()
	v := b.stateLocked(false)
	b.mu.Unlock()
	data, _ := json.Marshal(v)
	if bytes.Contains(data, []byte(b.key)) || bytes.Contains(data, []byte("proof-secret")) {
		t.Fatal("state leaked private key/nonce")
	}
}
