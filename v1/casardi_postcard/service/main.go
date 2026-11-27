// Casardi Windows/LAN bridge. Original code: MIT. No Python, cloud or disk PNGs.
package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"image/png"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	qrcode "github.com/skip2/go-qrcode"
)

const appID = "casardi-postcard-lan-3"
const maxPNG = 24 << 20
const minTTL = 300
const maxTTL = 600
const htmlName = "Cartolina_Casardi_PC_e_Telefono.html"

var tokenPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{32}$`)

type Network struct {
	IP    string `json:"ip"`
	Label string `json:"label"`
}
type Card struct {
	Token      string
	PNG        []byte
	Expires    time.Time
	Generation uint64
	Downloads  int
}
type Bridge struct {
	mu         sync.Mutex
	html       []byte
	key        string
	generation uint64
	card       *Card
	networks   []Network
	selected   string
	port       int
	ttl        time.Duration
	now        func() time.Time
	preview    bool
	stop       func()
}

func randomKey(n int) string {
	b := make([]byte, n)
	if _, e := rand.Read(b); e != nil {
		panic("secure random unavailable")
	}
	return base64.RawURLEncoding.EncodeToString(b)
}
func newBridge(html []byte, port int, ttl time.Duration, networks []Network) *Bridge {
	b := &Bridge{html: html, key: randomKey(32), generation: 1, port: port, ttl: ttl, networks: networks, now: time.Now}
	if len(networks) > 0 {
		b.selected = networks[0].IP
	}
	return b
}
func (b *Bridge) discardLocked() {
	// No PNG file is ever written. Clear the owned buffer before releasing it.
	if b.card != nil {
		clear(b.card.PNG)
		b.card.PNG = nil
		b.card = nil
	}
}
func (b *Bridge) expireLocked() {
	if b.card != nil && !b.now().Before(b.card.Expires) {
		b.discardLocked()
	}
}
func (b *Bridge) cleanup(ctx context.Context) {
	t := time.NewTicker(time.Second)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			b.mu.Lock()
			b.discardLocked()
			b.mu.Unlock()
			return
		case <-t.C:
			b.mu.Lock()
			b.expireLocked()
			b.mu.Unlock()
		}
	}
}

func localNetworks() []Network {
	var out []Network
	interfaces, _ := net.Interfaces()
	for _, iface := range interfaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, _ := iface.Addrs()
		for _, addr := range addrs {
			ip, _, e := net.ParseCIDR(addr.String())
			if e != nil || ip.To4() == nil || !ip.IsPrivate() {
				continue
			}
			out = append(out, Network{IP: ip.String(), Label: iface.Name + " · " + ip.String()})
		}
	}
	// Prefer ordinary home/school LANs over common container/VPN ranges.
	rank := func(ip string) int {
		if strings.HasPrefix(ip, "192.168.") {
			return 0
		}
		if strings.HasPrefix(ip, "10.") {
			return 1
		}
		return 2
	}
	sort.SliceStable(out, func(i, j int) bool { return rank(out[i].IP) < rank(out[j].IP) })
	return out
}
func hostOnly(host string) string {
	if h, _, e := net.SplitHostPort(host); e == nil {
		return h
	}
	return strings.Trim(host, "[]")
}
func (b *Bridge) validHost(host string) bool {
	h := strings.ToLower(hostOnly(host))
	if h == "localhost" || net.ParseIP(h) != nil && net.ParseIP(h).IsLoopback() {
		return true
	}
	for _, n := range b.networks {
		if h == n.IP {
			return true
		}
	}
	return b.preview && strings.HasSuffix(h, ".e2b.app")
}
func (b *Bridge) localClient(r *http.Request) bool {
	ip := net.ParseIP(hostOnly(r.RemoteAddr))
	if ip != nil && ip.IsLoopback() {
		return true
	}
	if ip != nil {
		for _, n := range b.networks {
			if ip.String() == n.IP {
				return true
			}
		}
	}
	return b.preview
}
func (b *Bridge) owner(r *http.Request) bool { return b.localClient(r) && b.validHost(r.Host) }
func noStore(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "no-store, max-age=0")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
}
func jsonReply(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
func apiError(w http.ResponseWriter, code int, message string) {
	jsonReply(w, code, map[string]any{"error": message})
}
func (b *Bridge) authorized(w http.ResponseWriter, r *http.Request) bool {
	if !b.owner(r) || subtle.ConstantTimeCompare([]byte(r.Header.Get("X-Casardi-Key")), []byte(b.key)) != 1 {
		apiError(w, 403, "Questo controllo è riservato al PC dello stand.")
		return false
	}
	origin := r.Header.Get("Origin")
	if origin != "" {
		u, e := url.Parse(origin)
		if e != nil || (u.Scheme != "http" && u.Scheme != "https") || !strings.EqualFold(u.Host, r.Host) {
			apiError(w, 403, "Origine della richiesta non autorizzata.")
			return false
		}
	}
	return true
}
func (b *Bridge) baseURL() string {
	if b.selected == "" {
		return ""
	}
	return fmt.Sprintf("http://%s:%d", b.selected, b.port)
}
func qrData(link string) string {
	if link == "" {
		return ""
	}
	raw, e := qrcode.Encode(link, qrcode.Medium, 360)
	if e != nil {
		return ""
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(raw)
}
func (b *Bridge) stateLocked(includeKey bool) map[string]any {
	b.expireLocked()
	base := b.baseURL()
	creator := ""
	if base != "" {
		creator = base + "/telefono"
	}
	result := map[string]any{"app": appID, "generation": b.generation, "ttl_seconds": int(b.ttl.Seconds()), "networks": b.networks, "selected_ip": b.selected, "creator_url": creator, "creator_qr": qrData(creator), "server_time": b.now().UnixMilli(), "local_service": true}
	if includeKey {
		result["key"] = b.key
	}
	if b.card != nil {
		link := base + "/download/" + b.card.Token
		if base == "" {
			link = ""
		}
		result["transfer"] = map[string]any{"url": link, "qr": qrData(link), "expires_at": b.card.Expires.UnixMilli(), "seconds_left": int(b.card.Expires.Sub(b.now()).Seconds()), "downloads": b.card.Downloads, "bytes": len(b.card.PNG)}
	} else {
		result["transfer"] = nil
	}
	return result
}
func (b *Bridge) root(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "HEAD" {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "Metodo non consentito", 405)
		return
	}
	if r.URL.Path != "/" && r.URL.Path != "/telefono" && r.URL.Path != "/telefono/" {
		http.NotFound(w, r)
		return
	}
	html := b.html
	if r.URL.Path == "/" && b.owner(r) && r.Method == "GET" {
		b.mu.Lock()
		b.discardLocked()
		b.generation++
		cfg, _ := json.Marshal(b.stateLocked(true))
		b.mu.Unlock()
		injected := []byte("<body>\n<script type=\"application/json\" id=\"local-service-config\">" + string(cfg) + "</script>")
		html = bytes.Replace(html, []byte("<body>"), injected, 1)
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
	// The trusted development preview must be embeddable, never on by default.
	if b.preview {
		w.Header().Set("Content-Security-Policy", strings.ReplaceAll(w.Header().Get("Content-Security-Policy"), "; frame-ancestors 'self'", ""))
	}
	w.Header().Set("Content-Length", strconv.Itoa(len(html)))
	if r.Method == "GET" {
		_, _ = w.Write(html)
	}
}
func (b *Bridge) api(w http.ResponseWriter, r *http.Request) {
	if !b.authorized(w, r) {
		return
	}
	switch r.URL.Path {
	case "/bridge/state":
		if r.Method != "GET" {
			apiError(w, 405, "Usa GET.")
			return
		}
		b.mu.Lock()
		state := b.stateLocked(false)
		b.mu.Unlock()
		jsonReply(w, 200, state)
	case "/bridge/reset":
		if r.Method != "POST" {
			apiError(w, 405, "Usa POST.")
			return
		}
		b.mu.Lock()
		b.discardLocked()
		b.generation++
		state := b.stateLocked(false)
		b.mu.Unlock()
		jsonReply(w, 200, state)
	case "/bridge/export":
		b.upload(w, r)
	case "/bridge/network":
		if r.Method != "POST" {
			apiError(w, 405, "Usa POST.")
			return
		}
		var data struct {
			IP string `json:"ip"`
		}
		dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024))
		dec.DisallowUnknownFields()
		if dec.Decode(&data) != nil {
			apiError(w, 400, "Indirizzo non valido.")
			return
		}
		ok := false
		for _, n := range b.networks {
			if n.IP == data.IP {
				ok = true
			}
		}
		if !ok {
			apiError(w, 400, "Scegli un indirizzo di rete realmente rilevato sul PC.")
			return
		}
		b.mu.Lock()
		b.selected = data.IP
		state := b.stateLocked(false)
		b.mu.Unlock()
		jsonReply(w, 200, state)
	case "/bridge/stop":
		if r.Method != "POST" {
			apiError(w, 405, "Usa POST.")
			return
		}
		b.mu.Lock()
		b.discardLocked()
		b.generation++
		b.mu.Unlock()
		jsonReply(w, 200, map[string]bool{"stopped": true})
		if b.stop != nil {
			go func() { time.Sleep(100 * time.Millisecond); b.stop() }()
		}
	default:
		apiError(w, 404, "Controllo non disponibile.")
	}
}
func (b *Bridge) upload(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		apiError(w, 405, "Usa POST.")
		return
	}
	if r.Header.Get("Content-Type") != "image/png" {
		apiError(w, 415, "È richiesto un PNG.")
		return
	}
	generation, e := strconv.ParseUint(r.Header.Get("X-Casardi-Generation"), 10, 64)
	if e != nil {
		apiError(w, 409, "Sessione scaduta: ricarica lo studio.")
		return
	}
	b.mu.Lock()
	valid := generation == b.generation
	b.mu.Unlock()
	if !valid {
		apiError(w, 409, "La sessione è stata azzerata: genera una nuova cartolina.")
		return
	}
	raw, e := io.ReadAll(http.MaxBytesReader(w, r.Body, maxPNG))
	if e != nil {
		apiError(w, 413, "PNG troppo grande o trasferimento interrotto. Puoi sempre salvarlo sul PC.")
		return
	}
	config, e := png.DecodeConfig(bytes.NewReader(raw))
	if e != nil || config.Width != 3000 || config.Height != 2000 {
		apiError(w, 400, "Il servizio accetta soltanto cartoline PNG 3000 × 2000.")
		return
	}
	// Decode validates all PNG chunk checksums rather than trusting only IHDR.
	if _, e = png.Decode(bytes.NewReader(raw)); e != nil {
		apiError(w, 400, "Il PNG è incompleto: generarlo di nuovo.")
		return
	}
	b.mu.Lock()
	defer b.mu.Unlock()
	if generation != b.generation {
		clear(raw)
		apiError(w, 409, "La sessione è stata azzerata durante il trasferimento.")
		return
	}
	b.discardLocked()
	b.card = &Card{Token: randomKey(24), PNG: raw, Expires: b.now().Add(b.ttl), Generation: b.generation}
	jsonReply(w, 201, b.stateLocked(false))
}

var phoneTemplate = template.Must(template.New("phone").Parse(`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>La tua cartolina · Casardi</title><style>
@font-face{font-family:Pixel;src:url(data:font/woff;base64,` + phoneFontData + `) format('woff');font-display:swap}
*{box-sizing:border-box}body{margin:0;background:#101426;color:#f6efd9;font:15px/1.8 ui-monospace,Consolas,monospace}main{max-width:780px;margin:auto;padding:29px 20px 40px}small{font:7px/2 Pixel,monospace;color:#b7c1d4}h1{font:clamp(17px,4.5vw,27px)/1.8 Pixel,monospace;margin:24px 0;color:#f6efd9}img{width:100%;height:auto;border:3px solid #667493;box-shadow:5px 5px 0 #050918;image-rendering:pixelated}a{display:block;min-height:56px;text-align:center;background:#82e4c4;color:#101a2b;padding:15px 16px;border:2px solid #bdffdf;box-shadow:3px 3px 0 #050918;text-decoration:none;margin:19px 0;font-weight:700}a:focus-visible{outline:3px solid #f1c675;outline-offset:4px}a.secondary{background:#1a2038;color:#f6efd9;border-color:#667493}p.note{font-size:12px;color:#b4bdd1}.badge{color:#f1c675;font:8px/2 Pixel,monospace;border-top:1px solid #495574;padding-top:22px;margin-top:22px}.expired{padding:20px;background:#263047;border:2px solid #f1c675;color:#f6efd9;font-size:14px}code{word-break:break-word}</style><main><small>LICEO ALFREDO CASARDI · BARLETTA</small>{{if .Available}}<p class="badge">OPEN DAY 2026/27</p><h1>La tua cartolina<br>è pronta.</h1><p>PNG originale · 3000 × 2000 pixel</p><img src="{{.Image}}" alt="La tua cartolina pronta da salvare"><a href="{{.File}}" download="Cartolina_Casardi.png">Scarica il PNG</a><a class="secondary" href="{{.Image}}" target="_blank" rel="noopener">Apri l’immagine</a><p>Su iPhone o se il download non parte: apri l’immagine, tieni premuto e scegli «Salva in Foto» oppure usa il menu Condividi del browser.</p><p class="note">Collegamento temporaneo: valido ancora circa {{.Minutes}} minuti, salvo «Nuova cartolina» sul PC. Salva prima di lasciare lo stand. La copia già scaricata resta tua; i crediti sono nei metadati del PNG.</p>{{else}}<h1>Questo collegamento<br>non è più valido.</h1><p class="expired">La cartolina è scaduta o la postazione è stata azzerata. Torna al PC dello stand per generarne una nuova. Le copie già salvate sul telefono non vengono cancellate.</p>{{end}}<p class="note">Trasferimento diretto sulla rete locale. Nessun account, cloud o pubblicazione online.</p></main></html>`))

func (b *Bridge) download(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "HEAD" {
		http.Error(w, "Metodo non consentito", 405)
		return
	}
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/download/"), "/")
	if len(parts) < 1 || len(parts) > 2 || !tokenPattern.MatchString(parts[0]) {
		http.NotFound(w, r)
		return
	}
	token := parts[0]
	action := ""
	if len(parts) == 2 {
		action = parts[1]
	}
	if action != "" && action != "file" && action != "image" {
		http.NotFound(w, r)
		return
	}
	b.mu.Lock()
	b.expireLocked()
	card := b.card
	if card == nil || subtle.ConstantTimeCompare([]byte(token), []byte(card.Token)) != 1 {
		b.mu.Unlock()
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; frame-ancestors 'none'")
		w.WriteHeader(410)
		if r.Method == "GET" {
			_ = phoneTemplate.Execute(w, map[string]any{"Available": false})
		}
		return
	}
	if action == "" {
		minutes := (int(card.Expires.Sub(b.now()).Seconds()) + 59) / 60
		b.mu.Unlock()
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
		if r.Method == "GET" {
			_ = phoneTemplate.Execute(w, map[string]any{"Available": true, "Image": "/download/" + token + "/image", "File": "/download/" + token + "/file", "Minutes": minutes})
		}
		return
	}
	// Copy while holding the lock so reset/expiry can wipe the original safely.
	data := append([]byte(nil), card.PNG...)
	if action == "file" && r.Method == "GET" {
		card.Downloads++
	}
	b.mu.Unlock()
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))
	if action == "file" {
		w.Header().Set("Content-Disposition", `attachment; filename="Cartolina_Casardi.png"`)
	} else {
		w.Header().Set("Content-Disposition", `inline; filename="Cartolina_Casardi.png"`)
	}
	if r.Method == "GET" {
		_, _ = w.Write(data)
	}
	clear(data)
}
func (b *Bridge) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	noStore(w)
	switch {
	case r.URL.Path == "/health":
		if r.Method != "GET" {
			http.Error(w, "Metodo non consentito", 405)
			return
		}
		jsonReply(w, 200, map[string]any{"app": appID, "version": "3.0"})
	case strings.HasPrefix(r.URL.Path, "/bridge/"):
		b.api(w, r)
	case strings.HasPrefix(r.URL.Path, "/download/"):
		b.download(w, r)
	default:
		b.root(w, r)
	}
}
func readHTML() ([]byte, error) {
	p := os.Getenv("CASARDI_HTML")
	if p == "" {
		exe, e := os.Executable()
		if e != nil {
			return nil, e
		}
		p = filepath.Join(filepath.Dir(exe), htmlName)
	}
	data, e := os.ReadFile(p)
	if e != nil {
		return nil, errors.New("Non trovo " + htmlName + " accanto al programma. Estrai tutto il file ZIP in una cartella, poi fai doppio clic su AVVIA_CARTOLINA_WINDOWS.exe.")
	}
	if !bytes.Contains(data, []byte("local-service-config")) || !bytes.Contains(data, []byte("<body>")) {
		return nil, errors.New("Il file HTML non è la versione abbinata a questo avvio. Estrai nuovamente tutto lo ZIP.")
	}
	return data, nil
}
func findListener() (net.Listener, int, bool, error) {
	ports := []int{8080, 8787, 8899}
	if v := os.Getenv("CASARDI_PORT"); v != "" {
		n, e := strconv.Atoi(v)
		if e != nil || n < 1024 || n > 65535 {
			return nil, 0, false, errors.New("Porta locale non valida.")
		}
		ports = []int{n}
	}
	for _, port := range ports {
		l, e := net.Listen("tcp", fmt.Sprintf("0.0.0.0:%d", port))
		if e == nil {
			return l, port, false, nil
		}
		client := http.Client{Timeout: time.Second}
		res, e := client.Get(fmt.Sprintf("http://127.0.0.1:%d/health", port))
		if e == nil {
			var state struct {
				App string `json:"app"`
			}
			_ = json.NewDecoder(io.LimitReader(res.Body, 2048)).Decode(&state)
			res.Body.Close()
			if state.App == appID {
				return nil, port, true, nil
			}
		}
	}
	return nil, 0, false, errors.New("Le porte locali sono occupate. Chiudi altre istanze dello studio o riavvia il PC; nessuna cartolina è stata salvata.")
}
func main() {
	data, e := readHTML()
	if e != nil {
		showError(e.Error())
		return
	}
	listener, port, existing, e := findListener()
	if e != nil {
		showError(e.Error())
		return
	}
	entry := fmt.Sprintf("http://127.0.0.1:%d/", port)
	if existing {
		if os.Getenv("CASARDI_NO_BROWSER") != "1" {
			if e = openBrowser(entry); e != nil {
				showError("Il servizio è già pronto. Apri manualmente " + entry)
			}
		}
		return
	}
	ttl := maxTTL
	if v, e := strconv.Atoi(os.Getenv("CASARDI_TTL")); e == nil && v >= minTTL && v <= maxTTL {
		ttl = v
	}
	b := newBridge(data, port, time.Duration(ttl)*time.Second, localNetworks())
	b.preview = os.Getenv("CASARDI_TRUST_PREVIEW") == "1"
	// Explicit QA-only loopback/link-local network, never used by the normal
	// Windows double-click launch. It does not certify school-Wi-Fi access.
	if b.preview {
		if ip := net.ParseIP(os.Getenv("CASARDI_QA_LAN_IP")); ip != nil && ip.To4() != nil && (ip.IsLoopback() || ip.IsLinkLocalUnicast()) {
			b.networks = []Network{{IP: ip.String(), Label: "Rete di collaudo (non Wi-Fi scuola) · " + ip.String()}}
			b.selected = ip.String()
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go b.cleanup(ctx)
	server := &http.Server{Handler: b, ReadHeaderTimeout: 8 * time.Second, ReadTimeout: 90 * time.Second, WriteTimeout: 90 * time.Second, IdleTimeout: 45 * time.Second, MaxHeaderBytes: 16 << 10, ErrorLog: log.New(io.Discard, "", 0)}
	b.stop = func() {
		cancel()
		shutdown, c := context.WithTimeout(context.Background(), 3*time.Second)
		defer c()
		_ = server.Shutdown(shutdown)
	}
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(sig)
	go func() {
		select {
		case <-sig:
			b.stop()
		case <-ctx.Done():
		}
	}()
	fmt.Println("Studio cartoline Casardi attivo. Apri", entry)
	fmt.Println("Nessun PNG su disco. I collegamenti scadono dopo", ttl, "secondi. Per fermare: Info → Arresta servizio.")
	if os.Getenv("CASARDI_NO_BROWSER") != "1" {
		if e = openBrowser(entry); e != nil {
			showError("Il servizio è pronto, ma non riesco ad aprire il browser. Apri manualmente " + entry)
		}
	}
	if e = server.Serve(listener); e != nil && !errors.Is(e, http.ErrServerClosed) {
		showError("Servizio interrotto. Salva il PNG dal browser, poi riapri il programma.")
	}
	b.mu.Lock()
	b.discardLocked()
	b.mu.Unlock()
}
