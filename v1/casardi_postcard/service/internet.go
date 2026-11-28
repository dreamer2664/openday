// Optional, explicitly enabled Cloudflare Quick Tunnel. Original code: MIT.
// Only the dedicated, loopback, read-only download listener is tunnelled.
package main

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"sync"
	"time"
)

const cloudflaredVersion = "2026.11.2"

type toolArtifact struct {
	name, digest string
	bytes        int64
}

func cloudflaredArtifact(goos, arch string) (toolArtifact, error) {
	if arch == "amd64" {
		switch goos {
		case "windows":
			return toolArtifact{"cloudflared-windows-amd64.exe", "555b46c85582461d189cac30d14ad05480d612613801be9f110b8ce08c5b2113", 55470800}, nil
		case "linux": // Same-source agent QA, not the Windows distribution.
			return toolArtifact{"cloudflared-linux-amd64", "56f13335143ec0e22772963290683a84a04114a35ec64cbc794a4d39ff9bb8cf", 40334417}, nil
		}
	}
	return toolArtifact{}, errors.New("Il QR Internet di questa edizione richiede Windows x64.")
}

func verifiedTool(path string, a toolArtifact) bool {
	info, err := os.Lstat(path)
	if err != nil || !info.Mode().IsRegular() || info.Size() != a.bytes {
		return false
	}
	f, err := os.Open(path)
	if err != nil {
		return false
	}
	defer f.Close()
	h := sha256.New()
	if _, err = io.Copy(h, f); err != nil {
		return false
	}
	return hex.EncodeToString(h.Sum(nil)) == a.digest
}

func downloadTool(ctx context.Context, client *http.Client, uri, dest string, a toolArtifact) error {
	req, err := http.NewRequestWithContext(ctx, "GET", uri, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Casardi-QR-Internet/1")
	res, err := client.Do(req)
	if err != nil {
		return errors.New("Download del componente Cloudflare non riuscito. Verifica Internet e le autorizzazioni IT; nessuna protezione va disattivata.")
	}
	defer res.Body.Close()
	if res.StatusCode != 200 || (res.ContentLength >= 0 && res.ContentLength != a.bytes) {
		return errors.New("Il download Cloudflare non corrisponde alla versione verificata.")
	}
	f, err := os.CreateTemp(filepath.Dir(dest), ".cloudflared-*.part")
	if err != nil {
		return errors.New("Non posso scrivere nella cache utente. Chiedi al responsabile IT.")
	}
	tmp := f.Name()
	defer os.Remove(tmp)
	h := sha256.New()
	n, copyErr := io.Copy(io.MultiWriter(f, h), io.LimitReader(res.Body, a.bytes+1))
	closeErr := f.Close()
	if copyErr != nil || closeErr != nil || n != a.bytes || hex.EncodeToString(h.Sum(nil)) != a.digest {
		return errors.New("Verifica SHA-256 Cloudflare non superata: il file NON viene eseguito. Riprova con una connessione autorizzata.")
	}
	if err = ctx.Err(); err != nil {
		return err
	}
	if err = os.Chmod(tmp, 0700); err != nil {
		return err
	}
	// An existing file is accepted only if byte-exact; never execute a partial
	// download or an arbitrary executable from the distribution directory.
	if verifiedTool(dest, a) {
		return nil
	}
	if _, err = os.Lstat(dest); err == nil {
		return errors.New("Nella cache esiste un componente non valido. L'IT deve rimuoverlo prima di riprovare.")
	}
	return os.Rename(tmp, dest)
}

func ensureCloudflared(ctx context.Context) (string, error) {
	a, err := cloudflaredArtifact(runtime.GOOS, runtime.GOARCH)
	if err != nil {
		return "", err
	}
	base, err := os.UserCacheDir()
	if err != nil {
		return "", errors.New("La cartella cache utente di Windows non e disponibile.")
	}
	dir := filepath.Join(base, "Casardi", "cloudflared", cloudflaredVersion)
	if err = os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	path := filepath.Join(dir, a.name)
	if verifiedTool(path, a) {
		return path, nil
	}
	client := &http.Client{Timeout: 3 * time.Minute, CheckRedirect: func(r *http.Request, via []*http.Request) error {
		if len(via) >= 6 || r.URL.Scheme != "https" {
			return errors.New("Redirect di download non autorizzato")
		}
		switch r.URL.Hostname() {
		case "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com", "github-releases.githubusercontent.com":
			return nil
		}
		return errors.New("Host di download non autorizzato")
	}}
	uri := "https://github.com/cloudflare/cloudflared/releases/download/" + cloudflaredVersion + "/" + a.name
	if err = downloadTool(ctx, client, uri, path, a); err != nil {
		return "", err
	}
	return path, nil
}

type InternetState struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	URL     string `json:"url,omitempty"`
}

type InternetTunnel struct {
	mu     sync.Mutex
	bridge *Bridge
	state  InternetState
	run    uint64
	cancel context.CancelFunc
	ensure func(context.Context) (string, error)
}

func newInternetTunnel(b *Bridge) *InternetTunnel {
	return &InternetTunnel{bridge: b, state: InternetState{Status: "off", Message: "QR Internet disattivato. Il QR LAN richiede la stessa rete."}, ensure: ensureCloudflared}
}
func (t *InternetTunnel) snapshot() InternetState {
	if t == nil {
		return InternetState{Status: "off", Message: "QR Internet non disponibile in questa istanza."}
	}
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.state
}
func (t *InternetTunnel) update(id uint64, status, message, public string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.run != id {
		return false
	}
	t.state = InternetState{Status: status, Message: message, URL: public}
	return true
}
func (t *InternetTunnel) start() {
	t.mu.Lock()
	if t.state.Status != "off" && t.state.Status != "error" {
		t.mu.Unlock()
		return
	}
	if t.cancel != nil {
		t.cancel()
	}
	t.run++
	id := t.run
	ctx, cancel := context.WithCancel(context.Background())
	t.cancel = cancel
	t.state = InternetState{Status: "downloading", Message: "Preparo Cloudflare. Al primo uso scarico e verifico circa 55 MB nella cache utente; poi non serve riscaricarli."}
	t.mu.Unlock()
	go t.serve(ctx, id)
}
func (t *InternetTunnel) stop() {
	if t == nil {
		return
	}
	t.mu.Lock()
	t.run++ // A cancelled/obsolete goroutine may never restore an old URL.
	cancel := t.cancel
	t.cancel = nil
	t.state = InternetState{Status: "off", Message: "QR Internet disattivato. Il QR LAN richiede la stessa rete."}
	t.mu.Unlock()
	if cancel != nil {
		cancel()
	}
}
func (t *InternetTunnel) isRun(id uint64, ready bool) bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	return id == t.run && t.state.Status != "off" && (!ready || t.state.Status == "ready")
}

func (t *InternetTunnel) publicHandler(id uint64, nonce string) http.Handler {
	limit := make(chan struct{}, 2)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		noStore(w)
		w.Header().Set("X-Robots-Tag", "noindex, nofollow, noarchive")
		if !t.isRun(id, false) {
			http.NotFound(w, r)
			return
		}
		if r.Method == "GET" && r.URL.Path == "/tunnel-health/"+nonce {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			_, _ = io.WriteString(w, "casardi-download-"+nonce)
			return
		}
		// Do NOT proxy the main HTTP server. Host, Forwarded and owner keys
		// cannot promote a request on this listener into an admin request.
		if !strings.HasPrefix(r.URL.Path, "/download/") {
			http.NotFound(w, r)
			return
		}
		if r.Method != "GET" && r.Method != "HEAD" {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "Metodo non consentito", 405)
			return
		}
		if !t.isRun(id, true) {
			http.Error(w, "Collegamento Internet temporaneamente non disponibile", 503)
			return
		}
		select {
		case limit <- struct{}{}:
			defer func() { <-limit }()
			t.bridge.downloadWithMode(w, r, true)
		default:
			w.Header().Set("Retry-After", "2")
			http.Error(w, "Download occupato: riprova tra pochi secondi", 429)
		}
	})
}

var quickURL = regexp.MustCompile(`https://[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.trycloudflare\.com`)

func validQuickURL(s string) bool {
	u, err := url.Parse(s)
	return err == nil && u.Scheme == "https" && u.User == nil && u.Port() == "" && u.Path == "" && u.RawQuery == "" && u.Fragment == "" && quickURL.FindString(s) == s
}
func publicProbe(ctx context.Context, client *http.Client, base, nonce string) bool {
	if !validQuickURL(base) {
		return false
	}
	req, err := http.NewRequestWithContext(ctx, "GET", base+"/tunnel-health/"+nonce, nil)
	if err != nil {
		return false
	}
	req.Header.Set("User-Agent", "Casardi-QR-Internet/1")
	req.Header.Set("Cache-Control", "no-cache")
	res, err := client.Do(req)
	if err != nil {
		return false
	}
	defer res.Body.Close()
	data, err := io.ReadAll(io.LimitReader(res.Body, 256))
	return err == nil && res.StatusCode == 200 && string(data) == "casardi-download-"+nonce
}
func cloudflaredEnv() []string {
	var env []string
	for _, s := range os.Environ() {
		name := strings.ToUpper(strings.SplitN(s, "=", 2)[0])
		if strings.HasPrefix(name, "TUNNEL_") || name == "NO_AUTOUPDATE" || name == "NO_TLS_VERIFY" {
			continue
		}
		env = append(env, s)
	}
	return append(env, "NO_AUTOUPDATE=true")
}

func (t *InternetTunnel) serve(parent context.Context, id uint64) {
	ctx, cancel := context.WithCancel(parent)
	defer cancel()
	fail := func(message string) { t.update(id, "error", message, "") }
	bin, err := t.ensure(ctx)
	if err != nil {
		if ctx.Err() == nil {
			fail(err.Error())
		}
		return
	}
	if ctx.Err() != nil {
		return
	}
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		fail("Non posso preparare il canale di download locale. Chiedi al responsabile IT.")
		return
	}
	nonce := randomKey(24)
	server := &http.Server{Handler: t.publicHandler(id, nonce), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 90 * time.Second, IdleTimeout: 30 * time.Second, MaxHeaderBytes: 16 << 10, ErrorLog: log.New(io.Discard, "", 0)}
	defer server.Close()
	go server.Serve(listener) // Closed in every exit path; never the owner server.
	// An explicit empty config prevents reuse of unrelated user tunnel/ingress
	// settings. It contains no credentials or visitor data and is removed.
	config, err := os.CreateTemp(filepath.Dir(bin), ".casardi-quick-*.yml")
	if err != nil {
		fail("Non posso preparare la configurazione temporanea di Cloudflare.")
		return
	}
	configName := config.Name()
	_, writeErr := config.WriteString("{}\n")
	closeErr := config.Close()
	defer os.Remove(configName)
	if writeErr != nil || closeErr != nil {
		fail("Non posso scrivere la configurazione temporanea di Cloudflare.")
		return
	}
	cmd := exec.CommandContext(ctx, bin, "tunnel", "--config", configName, "--no-autoupdate", "--url", "http://"+listener.Addr().String(), "--metrics", "127.0.0.1:0", "--edge-ip-version", "4", "--protocol", "auto", "--loglevel", "info", "--management-diagnostics=false")
	cmd.Env = cloudflaredEnv()
	configureTunnelProcess(cmd)
	output, err := cmd.StdoutPipe()
	if err != nil {
		fail("Impossibile avviare il componente Cloudflare.")
		return
	}
	cmd.Stderr = cmd.Stdout
	if err = cmd.Start(); err != nil {
		fail("Windows non avvia Cloudflare: verifica con l'IT antivirus, firma e policy. Non disattivare le protezioni.")
		return
	}
	cleanup, err := ownTunnelProcess(cmd)
	if err != nil {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		fail("Non posso isolare il processo Cloudflare. Chiedi al responsabile IT; il tunnel non viene lasciato attivo.")
		return
	}
	defer cleanup()
	urls := make(chan string, 1)
	exited := make(chan struct{})
	// Reap the helper BEFORE releasing its loopback port. A cancelled tunnel
	// must not survive and later proxy an unrelated process reusing that port.
	defer func() {
		cancel()
		_ = cmd.Process.Kill()
		select {
		case <-exited:
		case <-time.After(3 * time.Second):
		}
	}()
	go func() {
		scan := bufio.NewScanner(output)
		scan.Buffer(make([]byte, 4096), 128*1024)
		for scan.Scan() {
			if candidate := quickURL.FindString(scan.Text()); validQuickURL(candidate) {
				select {
				case urls <- candidate:
				default:
				}
			}
		}
		_ = cmd.Wait()
		close(exited)
	}()
	t.update(id, "starting", "Apro il collegamento HTTPS e ne verifico la raggiungibilita pubblica. Attendi fino a due minuti.", "")
	deadline := time.NewTimer(120 * time.Second)
	defer deadline.Stop()
	var public string
	select {
	case public = <-urls:
	case <-ctx.Done():
		return
	case <-exited:
		fail("Cloudflare si e chiuso prima di collegarsi. Verifica Internet e le autorizzazioni di rete con l'IT.")
		return
	case <-deadline.C:
		fail("Cloudflare non risponde. La rete potrebbe bloccare i tunnel; non viene mostrato un QR Internet non verificato.")
		return
	}
	client := &http.Client{Timeout: 6 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	tick := time.NewTicker(2 * time.Second)
	defer tick.Stop()
	for !publicProbe(ctx, client, public, nonce) {
		select {
		case <-tick.C:
		case <-ctx.Done():
			return
		case <-exited:
			fail("Il collegamento Cloudflare si e interrotto. Riprova da Info, senza disattivare il firewall.")
			return
		case <-deadline.C:
			fail("Il collegamento pubblico non e raggiungibile. Controlla la connessione o chiedi all'IT se Cloudflare Tunnel e consentito.")
			return
		}
	}
	t.update(id, "ready", "QR Internet attivo: il telefono puo usare anche 4G/5G o un'altra Wi-Fi. Lascia PC, programma e Internet attivi.", public)
	monitor := time.NewTicker(15 * time.Second)
	defer monitor.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-exited:
			fail("Il tunnel si e chiuso. Il salvataggio sul PC resta disponibile; riattiva QR Internet da Info.")
			return
		case <-monitor.C:
			if publicProbe(ctx, client, public, nonce) {
				t.update(id, "ready", "QR Internet attivo: il telefono puo usare anche 4G/5G o un'altra Wi-Fi. Lascia PC, programma e Internet attivi.", public)
			} else {
				t.update(id, "reconnecting", "Connessione Internet interrotta: provo a ripristinarla. Il QR e nascosto finche il collegamento non torna raggiungibile.", "")
			}
		}
	}
}

func (b *Bridge) internetAPI(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		apiError(w, 405, "Usa POST.")
		return
	}
	if b.internet == nil {
		apiError(w, 503, "QR Internet non disponibile in questa istanza.")
		return
	}
	var data struct {
		Action string `json:"action"`
	}
	if !decodeSmallJSON(w, r, &data) {
		return
	}
	switch data.Action {
	case "start":
		b.internet.start()
	case "stop":
		b.internet.stop()
	default:
		apiError(w, 400, "Azione non valida.")
		return
	}
	b.mu.Lock()
	state := b.stateLocked(false)
	b.mu.Unlock()
	jsonReply(w, 200, state)
}

// Separate helper keeps strict JSON parsing and body limits consistent.
func decodeSmallJSON(w http.ResponseWriter, r *http.Request, dest any) bool {
	if r.Header.Get("Content-Type") != "application/json" {
		apiError(w, 415, "E richiesto JSON.")
		return false
	}
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dest); err != nil {
		apiError(w, 400, "Richiesta non valida.")
		return false
	}
	if err := decoder.Decode(new(any)); err != io.EOF {
		apiError(w, 400, "Richiesta non valida.")
		return false
	}
	return true
}
