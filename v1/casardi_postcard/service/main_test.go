package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

var fixtureOnce sync.Once
var fixturePNG []byte

func fixture() []byte {
	fixtureOnce.Do(func() {
		im := image.NewRGBA(image.Rect(0, 0, 3000, 2000))
		for i := 0; i < len(im.Pix); i += 4 {
			im.Pix[i] = 24
			im.Pix[i+1] = 45
			im.Pix[i+2] = 57
			im.Pix[i+3] = 255
		}
		var out bytes.Buffer
		_ = png.Encode(&out, im)
		fixturePNG = out.Bytes()
	})
	return fixturePNG
}
func testBridge() *Bridge {
	return newBridge([]byte("<!doctype html><body>local-service-config</body>"), 8083, 600*time.Second, []Network{{IP: "192.168.50.23", Label: "Wi-Fi"}})
}
func req(b *Bridge, method, path string, body io.Reader, key bool) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, "http://127.0.0.1:8083"+path, body)
	r.RemoteAddr = "127.0.0.1:45123"
	if key {
		r.Header.Set("X-Casardi-Key", b.key)
		r.Header.Set("X-Casardi-Generation", "1")
	}
	if body != nil {
		r.Header.Set("Content-Type", "image/png")
	}
	w := httptest.NewRecorder()
	b.ServeHTTP(w, r)
	return w
}
func uploadGood(t *testing.T, b *Bridge) map[string]any {
	t.Helper()
	w := req(b, "POST", "/bridge/export", bytes.NewReader(fixture()), true)
	if w.Code != 201 {
		t.Fatalf("export %d %s", w.Code, w.Body.String())
	}
	var d map[string]any
	if e := json.Unmarshal(w.Body.Bytes(), &d); e != nil {
		t.Fatal(e)
	}
	return d
}
func pathFor(b *Bridge) string { return "/download/" + b.card.Token }

func TestUnpredictable192BitTokens(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 100; i++ {
		s := randomKey(24)
		raw, e := base64.RawURLEncoding.DecodeString(s)
		if e != nil || len(raw) != 24 || !tokenPattern.MatchString(s) || seen[s] {
			t.Fatal("bad random token")
		}
		seen[s] = true
	}
}
func TestPNGUploadAndOriginalBytes(t *testing.T) {
	b := testBridge()
	d := uploadGood(t, b)
	if d["ttl_seconds"].(float64) != 600 {
		t.Fatal(d)
	}
	w := req(b, "GET", pathFor(b)+"/file", nil, false)
	if w.Code != 200 || !bytes.Equal(w.Body.Bytes(), fixture()) {
		t.Fatal("download differs")
	}
	if !strings.Contains(w.Header().Get("Content-Disposition"), "attachment") {
		t.Fatal("no download")
	}
}
func TestExpiryAtExactDeadline(t *testing.T) {
	b := testBridge()
	now := time.Unix(1000, 0)
	b.now = func() time.Time { return now }
	uploadGood(t, b)
	p := pathFor(b)
	now = now.Add(599 * time.Second)
	if req(b, "GET", p+"/file", nil, false).Code != 200 {
		t.Fatal("early expiry")
	}
	now = now.Add(time.Second)
	if req(b, "GET", p+"/file", nil, false).Code != 410 || b.card != nil {
		t.Fatal("expiry failed")
	}
}
func TestEveryDownloadRouteChecksExpiry(t *testing.T) {
	for _, suffix := range []string{"", "/image", "/file"} {
		t.Run(suffix, func(t *testing.T) {
			b := testBridge()
			uploadGood(t, b)
			p := pathFor(b)
			b.card.Expires = time.Now().Add(-time.Second)
			if req(b, "GET", p+suffix, nil, false).Code != 410 || b.card != nil {
				t.Fatal("expired route leaked")
			}
		})
	}
}
func TestResetRevokesAndWipesMemory(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	p := pathFor(b)
	owned := b.card.PNG
	w := req(b, "POST", "/bridge/reset", nil, true)
	if w.Code != 200 || b.card != nil || b.generation != 2 {
		t.Fatal("reset failed")
	}
	for _, v := range owned {
		if v != 0 {
			t.Fatal("PNG buffer not cleared")
		}
	}
	if req(b, "GET", p+"/file", nil, false).Code != 410 {
		t.Fatal("old token valid")
	}
}
func TestNewExportReplacesPrevious(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	old := pathFor(b)
	uploadGood(t, b)
	if pathFor(b) == old || req(b, "GET", old+"/file", nil, false).Code != 410 {
		t.Fatal("old export survives")
	}
}
func TestNewPCSessionRevokesPrevious(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	p := pathFor(b)
	w := req(b, "GET", "/", nil, false)
	if w.Code != 200 || !strings.Contains(w.Body.String(), `id="local-service-config"`) || b.generation != 2 || b.card != nil {
		t.Fatal("new session failed")
	}
	if req(b, "GET", p, nil, false).Code != 410 {
		t.Fatal("old session survives")
	}
}
func TestPhoneCreatorDoesNotResetOrRevealKey(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	for _, p := range []string{"/telefono", "/telefono/"} {
		w := req(b, "GET", p, nil, false)
		if w.Code != 200 || strings.Contains(w.Body.String(), b.key) || b.card == nil || b.generation != 1 {
			t.Fatal("phone creator owns/resets PC")
		}
		if w.Header().Get("Set-Cookie") != "" {
			t.Fatal("cookie")
		}
	}
}
func TestRemoteRootDoesNotRevealOwnerKey(t *testing.T) {
	b := testBridge()
	r := httptest.NewRequest("GET", "http://192.168.50.23:8083/", nil)
	r.RemoteAddr = "192.168.50.55:10000"
	w := httptest.NewRecorder()
	b.ServeHTTP(w, r)
	if w.Code != 200 || strings.Contains(w.Body.String(), b.key) || b.generation != 1 {
		t.Fatal("remote obtained owner")
	}
}
func TestOwnerCapabilityRequired(t *testing.T) {
	b := testBridge()
	for _, path := range []string{"/bridge/state", "/bridge/reset", "/bridge/export", "/bridge/network", "/bridge/stop"} {
		if req(b, "POST", path, nil, false).Code != 403 {
			t.Fatal("missing key accepted", path)
		}
	}
}
func TestRemoteCannotWriteEvenWithKey(t *testing.T) {
	b := testBridge()
	r := httptest.NewRequest("POST", "http://192.168.50.23:8083/bridge/reset", nil)
	r.RemoteAddr = "192.168.50.55:10000"
	r.Header.Set("X-Casardi-Key", b.key)
	w := httptest.NewRecorder()
	b.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("remote can reset")
	}
}
func TestCrossOriginRejected(t *testing.T) {
	b := testBridge()
	for _, origin := range []string{"https://evil.invalid", "null", "http://127.0.0.1:9999"} {
		r := httptest.NewRequest("POST", "http://127.0.0.1:8083/bridge/reset", nil)
		r.RemoteAddr = "127.0.0.1:10000"
		r.Header.Set("X-Casardi-Key", b.key)
		r.Header.Set("Origin", origin)
		w := httptest.NewRecorder()
		b.ServeHTTP(w, r)
		if w.Code != 403 || w.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Fatal("cross origin accepted")
		}
	}
}
func TestDNSRebindingHostRejected(t *testing.T) {
	b := testBridge()
	r := httptest.NewRequest("GET", "http://malicious.invalid:8083/", nil)
	r.RemoteAddr = "127.0.0.1:10000"
	w := httptest.NewRecorder()
	b.ServeHTTP(w, r)
	if strings.Contains(w.Body.String(), b.key) {
		t.Fatal("rebound host got key")
	}
	r = httptest.NewRequest("POST", "http://malicious.invalid:8083/bridge/reset", nil)
	r.RemoteAddr = "127.0.0.1:10000"
	r.Header.Set("X-Casardi-Key", b.key)
	w = httptest.NewRecorder()
	b.ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("rebound host can write")
	}
}
func TestStaleGenerationCannotUpload(t *testing.T) {
	b := testBridge()
	_ = req(b, "POST", "/bridge/reset", nil, true)
	w := req(b, "POST", "/bridge/export", bytes.NewReader(fixture()), true)
	if w.Code != 409 || b.card != nil {
		t.Fatal("stale generation accepted")
	}
}

type heldReader struct {
	raw     *bytes.Reader
	started chan struct{}
	release chan struct{}
	once    sync.Once
}

func (r *heldReader) Read(p []byte) (int, error) {
	r.once.Do(func() { close(r.started); <-r.release })
	return r.raw.Read(p)
}
func TestInflightUploadCannotResurrectAfterReset(t *testing.T) {
	b := testBridge()
	reader := &heldReader{raw: bytes.NewReader(fixture()), started: make(chan struct{}), release: make(chan struct{})}
	done := make(chan *httptest.ResponseRecorder, 1)
	go func() { done <- req(b, "POST", "/bridge/export", reader, true) }()
	<-reader.started
	_ = req(b, "POST", "/bridge/reset", nil, true)
	close(reader.release)
	w := <-done
	if w.Code != 409 || b.card != nil {
		t.Fatal("inflight upload resurrected")
	}
}
func TestBadDimensionsAndCorruptPNGRejected(t *testing.T) {
	b := testBridge()
	im := image.NewUniform(color.Black)
	_ = im
	small := image.NewRGBA(image.Rect(0, 0, 300, 200))
	var out bytes.Buffer
	_ = png.Encode(&out, small)
	bad := append([]byte(nil), fixture()...)
	bad[len(bad)/2] ^= 255
	for _, data := range [][]byte{[]byte("not PNG"), out.Bytes(), bad} {
		w := req(b, "POST", "/bridge/export", bytes.NewReader(data), true)
		if w.Code != 400 || b.card != nil {
			t.Fatal("invalid PNG accepted", w.Code)
		}
	}
}
func TestBodySizeIsBounded(t *testing.T) {
	b := testBridge()
	w := req(b, "POST", "/bridge/export", io.LimitReader(zeroReader{}, maxPNG+1), true)
	if w.Code != 413 {
		t.Fatal("unbounded upload", w.Code)
	}
}

type zeroReader struct{}

func (zeroReader) Read(p []byte) (int, error) { clear(p); return len(p), nil }
func TestNoDirectoryBrowsingOrSourceFiles(t *testing.T) {
	b := testBridge()
	for _, p := range []string{"/assets/", "/var/", "/service/main.go", "/download/", "/download/not-a-token", "/../main.go", "/favicon.ico"} {
		if req(b, "GET", p, nil, false).Code != 404 {
			t.Fatal("unintended path", p)
		}
	}
}
func TestGETCannotResetAndNoCookieOrCache(t *testing.T) {
	b := testBridge()
	w := req(b, "GET", "/bridge/reset", nil, true)
	if w.Code != 405 || b.generation != 1 {
		t.Fatal("GET reset")
	}
	if !strings.Contains(w.Header().Get("Cache-Control"), "no-store") || w.Header().Get("Set-Cookie") != "" || w.Header().Get("Referrer-Policy") != "no-referrer" {
		t.Fatal("cache/privacy headers")
	}
}
func TestPNGInlineAndMobilePage(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	p := pathFor(b)
	w := req(b, "GET", p, nil, false)
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Scarica il PNG") || !strings.Contains(w.Body.String(), p+"/image") {
		t.Fatal("mobile page")
	}
	w = req(b, "GET", p+"/image", nil, false)
	if w.Code != 200 || !strings.HasPrefix(w.Header().Get("Content-Disposition"), "inline") {
		t.Fatal("inline fallback")
	}
}
func TestNetworkSelectionValidated(t *testing.T) {
	b := testBridge()
	for _, tc := range []struct {
		ip   string
		code int
	}{{"1.2.3.4", 400}, {"192.168.50.23", 200}} {
		r := httptest.NewRequest("POST", "http://127.0.0.1:8083/bridge/network", strings.NewReader(`{"ip":"`+tc.ip+`"}`))
		r.RemoteAddr = "127.0.0.1:10000"
		r.Header.Set("X-Casardi-Key", b.key)
		w := httptest.NewRecorder()
		b.ServeHTTP(w, r)
		if w.Code != tc.code {
			t.Fatal(tc.ip, w.Code)
		}
	}
}
func TestNoLANDoesNotInventReachableURL(t *testing.T) {
	b := newBridge(nil, 8083, 600*time.Second, nil)
	d := uploadGood(t, b)
	transfer := d["transfer"].(map[string]any)
	if transfer["url"] != "" || transfer["qr"] != "" || d["creator_url"] != "" {
		t.Fatal("invented LAN URL")
	}
}
func TestCleanerDeletesWithoutHTTPRequests(t *testing.T) {
	b := testBridge()
	var clock atomic.Int64
	clock.Store(time.Now().UnixNano())
	b.now = func() time.Time { return time.Unix(0, clock.Load()) }
	uploadGood(t, b)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go b.cleanup(ctx)
	clock.Add(int64(601 * time.Second))
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		b.mu.Lock()
		gone := b.card == nil
		b.mu.Unlock()
		if gone {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("cleaner did not delete")
}
func TestShutdownWipesMemory(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() { b.cleanup(ctx); close(done) }()
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not stop")
	}
	if b.card != nil {
		t.Fatal("shutdown retained card")
	}
}
func TestQRIsARealPNGWithQuietBorder(t *testing.T) {
	uri := qrData("http://192.168.50.23:8083/download/abcdefghijklmnopqrstuvwxyz123456")
	raw, e := base64.StdEncoding.DecodeString(strings.TrimPrefix(uri, "data:image/png;base64,"))
	if e != nil {
		t.Fatal(e)
	}
	im, e := png.Decode(bytes.NewReader(raw))
	if e != nil || im.Bounds().Dx() != 360 {
		t.Fatal("not a QR PNG")
	}
	r, g, bb, _ := im.At(0, 0).RGBA()
	if r != 65535 || g != 65535 || bb != 65535 {
		t.Fatal("missing quiet zone")
	}
}
func TestHeadNeverReturnsPNGBody(t *testing.T) {
	b := testBridge()
	uploadGood(t, b)
	w := req(b, "HEAD", pathFor(b)+"/file", nil, false)
	if w.Code != http.StatusOK || w.Body.Len() != 0 || w.Header().Get("Content-Length") == "" {
		t.Fatal("HEAD semantics")
	}
}
